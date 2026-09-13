import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export interface MilestoneItem {
  id: string;
  stat: string;
  title: string;
  sub: string;
  image_url: string;
  display_order?: number;
}

export interface GalleryItem {
  id: string;
  category: 'awards' | 'lectures' | 'clinics' | 'dialysis';
  title: string;
  location: string;
  year: string;
  imageUrl: string; // mapped from image_url or imageUrl
  caption: string;
  display_order?: number;
}

const DEFAULT_MILESTONES: MilestoneItem[] = [
  {
    id: 'm-01',
    stat: 'GOLD MEDAL',
    title: 'DNB Nephrology Academic Standing',
    sub: 'Dr. RML Institute of Medical Sciences, Lucknow',
    image_url: '/images/gold_medal_badge.jpg',
    display_order: 1
  },
  {
    id: 'm-02',
    stat: 'ISN HONOR',
    title: 'ISN Research Excellence Award',
    sub: 'Indian Society of Nephrology (ISNCON Conference)',
    image_url: '/images/isn_award_badge.jpg',
    display_order: 2
  },
  {
    id: 'm-03',
    stat: 'NABH CERTIFIED',
    title: 'NABH Quality Healthcare Standards',
    sub: 'Certified OPD & Dialysis Care Protocol',
    image_url: '/images/nabh_accredited_badge.jpg',
    display_order: 3
  }
];

const DEFAULT_GALLERY_ITEMS: GalleryItem[] = [
  {
    id: 'g-01',
    category: 'lectures',
    title: 'Guest Lecture on Living Donor Renal Transplant Protocols',
    location: 'Dr. RML Institute of Medical Sciences, Lucknow',
    year: '2025',
    imageUrl: '/images/anmol_lecture.png',
    caption: 'Dr. Anmol Pandey in formal suit delivering an interactive keynote guest lecture at the International Medical Conference.',
    display_order: 1
  },
  {
    id: 'g-02',
    category: 'awards',
    title: 'Felicitation & Medical Association Honor',
    location: 'Lucknow Medical Association Convention',
    year: '2024',
    imageUrl: '/images/anmol_award.png',
    caption: 'Dr. Anmol Pandey honored for clinical contributions in kidney disease management and renal transplant medicine.',
    display_order: 2
  },
  {
    id: 'g-03',
    category: 'clinics',
    title: 'Dr. Anmol Pandey Clinical Visit & Site Inspection',
    location: 'Vibhuti Khand, Gomti Nagar, Lucknow',
    year: '2025',
    imageUrl: '/images/anmol_real_original.png',
    caption: 'Dr. Anmol Pandey during clinic site visits and patient facility inspections.',
    display_order: 3
  }
];

export function useHonorsMedia() {
  const [milestones, setMilestones] = useState<MilestoneItem[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch data
  const fetchData = useCallback(async () => {
    setLoading(true);

    if (!isSupabaseConfigured) {
      // Local fallback
      const savedMilestones = localStorage.getItem('custom_honors_milestones');
      const savedGallery = localStorage.getItem('custom_gallery_items');

      setMilestones(savedMilestones ? JSON.parse(savedMilestones) : DEFAULT_MILESTONES);
      setGalleryItems(savedGallery ? JSON.parse(savedGallery) : DEFAULT_GALLERY_ITEMS);
      setLoading(false);
      return;
    }

    try {
      // Fetch Milestones
      const { data: mData, error: mErr } = await supabase
        .from('honors_milestones')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: true });

      if (mErr || !mData || mData.length === 0) {
        const savedMilestones = localStorage.getItem('custom_honors_milestones');
        setMilestones(savedMilestones ? JSON.parse(savedMilestones) : DEFAULT_MILESTONES);
      } else {
        setMilestones(mData);
      }

      // Fetch Gallery Items
      const { data: gData, error: gErr } = await supabase
        .from('gallery_items')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });

      if (gErr || !gData || gData.length === 0) {
        const savedGallery = localStorage.getItem('custom_gallery_items');
        setGalleryItems(savedGallery ? JSON.parse(savedGallery) : DEFAULT_GALLERY_ITEMS);
      } else {
        const mappedGallery: GalleryItem[] = gData.map(item => ({
          id: item.id,
          category: item.category,
          title: item.title,
          location: item.location,
          year: item.year,
          imageUrl: item.image_url || item.imageUrl || '/images/doctor_portrait.jpg',
          caption: item.caption,
          display_order: item.display_order
        }));
        setGalleryItems(mappedGallery);
      }
    } catch {
      const savedMilestones = localStorage.getItem('custom_honors_milestones');
      const savedGallery = localStorage.getItem('custom_gallery_items');

      setMilestones(savedMilestones ? JSON.parse(savedMilestones) : DEFAULT_MILESTONES);
      setGalleryItems(savedGallery ? JSON.parse(savedGallery) : DEFAULT_GALLERY_ITEMS);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Add or Update Milestone Badge
  const saveMilestone = async (item: Partial<MilestoneItem> & { stat: string; title: string; sub: string; image_url: string }) => {
    const isEdit = Boolean(item.id);
    const id = item.id || `m-${Date.now()}`;

    const newMilestone: MilestoneItem = {
      id,
      stat: item.stat,
      title: item.title,
      sub: item.sub,
      image_url: item.image_url,
      display_order: item.display_order || milestones.length + 1
    };

    const updatedMilestones = isEdit
      ? milestones.map(m => (m.id === id ? newMilestone : m))
      : [...milestones, newMilestone];

    setMilestones(updatedMilestones);
    localStorage.setItem('custom_honors_milestones', JSON.stringify(updatedMilestones));

    if (isSupabaseConfigured) {
      try {
        if (isEdit && !id.startsWith('m-')) {
          await supabase.from('honors_milestones').update({
            stat: item.stat,
            title: item.title,
            sub: item.sub,
            image_url: item.image_url
          }).eq('id', id);
        } else {
          await supabase.from('honors_milestones').insert([{
            stat: item.stat,
            title: item.title,
            sub: item.sub,
            image_url: item.image_url,
            display_order: newMilestone.display_order
          }]);
        }
      } catch (err) {
        console.warn('Supabase milestone save fallback note:', err);
      }
    }
  };

  // Delete Milestone Badge
  const deleteMilestone = async (id: string) => {
    const updated = milestones.filter(m => m.id !== id);
    setMilestones(updated);
    localStorage.setItem('custom_honors_milestones', JSON.stringify(updated));

    if (isSupabaseConfigured && !id.startsWith('m-')) {
      try {
        await supabase.from('honors_milestones').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase milestone delete note:', err);
      }
    }
  };

  // Add or Update Gallery Post
  const saveGalleryItem = async (item: Partial<GalleryItem> & { category: GalleryItem['category']; title: string; location: string; year: string; imageUrl: string; caption: string }) => {
    const isEdit = Boolean(item.id);
    const id = item.id || `g-${Date.now()}`;

    const newGalleryItem: GalleryItem = {
      id,
      category: item.category,
      title: item.title,
      location: item.location,
      year: item.year,
      imageUrl: item.imageUrl,
      caption: item.caption,
      display_order: item.display_order || galleryItems.length + 1
    };

    const updatedGallery = isEdit
      ? galleryItems.map(g => (g.id === id ? newGalleryItem : g))
      : [newGalleryItem, ...galleryItems];

    setGalleryItems(updatedGallery);
    localStorage.setItem('custom_gallery_items', JSON.stringify(updatedGallery));

    if (isSupabaseConfigured) {
      try {
        if (isEdit && !id.startsWith('g-')) {
          await supabase.from('gallery_items').update({
            category: item.category,
            title: item.title,
            location: item.location,
            year: item.year,
            image_url: item.imageUrl,
            caption: item.caption
          }).eq('id', id);
        } else {
          await supabase.from('gallery_items').insert([{
            category: item.category,
            title: item.title,
            location: item.location,
            year: item.year,
            image_url: item.imageUrl,
            caption: item.caption,
            display_order: newGalleryItem.display_order
          }]);
        }
      } catch (err) {
        console.warn('Supabase gallery item save fallback note:', err);
      }
    }
  };

  // Delete Gallery Post
  const deleteGalleryItem = async (id: string) => {
    const updated = galleryItems.filter(g => g.id !== id);
    setGalleryItems(updated);
    localStorage.setItem('custom_gallery_items', JSON.stringify(updated));

    if (isSupabaseConfigured && !id.startsWith('g-')) {
      try {
        await supabase.from('gallery_items').delete().eq('id', id);
      } catch (err) {
        console.warn('Supabase gallery item delete note:', err);
      }
    }
  };

  return {
    milestones,
    galleryItems,
    loading,
    refetch: fetchData,
    saveMilestone,
    deleteMilestone,
    saveGalleryItem,
    deleteGalleryItem
  };
}
