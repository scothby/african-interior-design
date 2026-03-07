import React, { useState, useEffect, useCallback } from 'react';
import { supabase, invalidateStylesCache } from './supabaseClient';
import { useTranslation } from 'react-i18next';
import { useAuth } from './AuthContext';
import StyleManager from './StyleManager';

export default function AdminManager({ onBack }) {
    const { t } = useTranslation();
    const [activeTab, setActiveTab] = useState('styles'); // 'styles', 'rooms', 'palettes'

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} style={s.btnBack}>← {t('gallery.back')}</button>
                    <h2 style={{ margin: 0 }}>⚙️ {t('admin.title', { defaultValue: 'Administration' })}</h2>
                </div>
            </div>

            <div style={s.tabs}>
                <button
                    onClick={() => setActiveTab('styles')}
                    style={{ ...s.tab, ...(activeTab === 'styles' ? s.activeTab : {}) }}
                >
                    🏺 Styles
                </button>
                <button
                    onClick={() => setActiveTab('rooms')}
                    style={{ ...s.tab, ...(activeTab === 'rooms' ? s.activeTab : {}) }}
                >
                    🏠 Types de Pièces
                </button>
                <button
                    onClick={() => setActiveTab('palettes')}
                    style={{ ...s.tab, ...(activeTab === 'palettes' ? s.activeTab : {}) }}
                >
                    🎨 Palettes
                </button>
                <button
                    onClick={() => setActiveTab('landing')}
                    style={{ ...s.tab, ...(activeTab === 'landing' ? s.activeTab : {}) }}
                >
                    🖼️ Landing Assets
                </button>
                <button
                    onClick={() => setActiveTab('testimonials')}
                    style={{ ...s.tab, ...(activeTab === 'testimonials' ? s.activeTab : {}) }}
                >
                    💬 Témoignages
                </button>
            </div>

            <div style={s.content}>
                {activeTab === 'styles' && <StyleManager onBack={onBack} embed={true} />}
                {activeTab === 'rooms' && <RoomTypeManager />}
                {activeTab === 'palettes' && <PaletteManager />}
                {activeTab === 'landing' && <LandingAssetManager />}
                {activeTab === 'testimonials' && <TestimonialManager />}
            </div>
        </div>
    );
}

function RoomTypeManager() {
    const [rooms, setRooms] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingRoom, setEditingRoom] = useState(null);
    const [formData, setFormData] = useState({ id: '', name: '', icon: '' });

    const fetchRooms = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('room_types').select('*').order('name');
        setRooms(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchRooms(); }, [fetchRooms]);

    const handleSave = async (e) => {
        e.preventDefault();
        if (editingRoom) {
            await supabase.from('room_types').update({ name: formData.name, icon: formData.icon }).eq('id', formData.id);
        } else {
            const id = formData.name.toLowerCase().replace(/\s+/g, '_');
            await supabase.from('room_types').insert([{ id, name: formData.name, icon: formData.icon }]);
        }
        setEditingRoom(null);
        setFormData({ id: '', name: '', icon: '' });
        fetchRooms();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce type de pièce ?')) return;
        await supabase.from('room_types').delete().eq('id', id);
        fetchRooms();
    };

    return (
        <div>
            <form onSubmit={handleSave} style={s.inlineForm}>
                <input
                    placeholder="Nom (ex: Salle de sport)"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    style={s.input}
                    required
                />
                <input
                    placeholder="Emoji (ex: 🏋️)"
                    value={formData.icon}
                    onChange={e => setFormData({ ...formData, icon: e.target.value })}
                    style={{ ...s.input, width: '80px' }}
                />
                <button type="submit" style={s.btnPrimary}>{editingRoom ? 'Modifier' : 'Ajouter'}</button>
                {editingRoom && <button onClick={() => { setEditingRoom(null); setFormData({ id: '', name: '', icon: '' }); }} style={s.btnBack}>Annuler</button>}
            </form>

            <div style={s.grid}>
                {rooms.map(room => (
                    <div key={room.id} style={s.card}>
                        <span style={{ fontSize: '24px' }}>{room.icon}</span>
                        <div style={{ flex: 1, fontWeight: 'bold' }}>{room.name}</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={() => { setEditingRoom(room); setFormData(room); }} style={s.iconBtn}>✏️</button>
                            <button onClick={() => handleDelete(room.id)} style={s.iconBtn}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function PaletteManager() {
    const [palettes, setPalettes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [editingPalette, setEditingPalette] = useState(null);
    const [formData, setFormData] = useState({ id: '', name: '', colors: '' });

    const fetchPalettes = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('color_palettes').select('*').order('name');
        setPalettes(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchPalettes(); }, [fetchPalettes]);

    const handleSave = async (e) => {
        e.preventDefault();
        const colorsArray = formData.colors.split(',').map(c => c.trim()).filter(Boolean);
        if (editingPalette) {
            await supabase.from('color_palettes').update({ name: formData.name, colors: colorsArray }).eq('id', formData.id);
        } else {
            const id = formData.name.toLowerCase().replace(/\s+/g, '_');
            await supabase.from('color_palettes').insert([{ id, name: formData.name, colors: colorsArray }]);
        }
        setEditingPalette(null);
        setFormData({ id: '', name: '', colors: '' });
        fetchPalettes();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cette palette ?')) return;
        await supabase.from('color_palettes').delete().eq('id', id);
        fetchPalettes();
    };

    return (
        <div>
            <form onSubmit={handleSave} style={{ ...s.inlineForm, flexDirection: 'column', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', gap: '10px', width: '100%' }}>
                    <input
                        placeholder="Nom de la palette"
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        style={s.input}
                        required
                    />
                    <input
                        placeholder="Couleurs (ex: #ff0000, #00ff00)"
                        value={formData.colors}
                        onChange={e => setFormData({ ...formData, colors: e.target.value })}
                        style={{ ...s.input, flex: 2 }}
                        required
                    />
                    <button type="submit" style={s.btnPrimary}>{editingPalette ? 'Modifier' : 'Ajouter'}</button>
                    {editingPalette && <button onClick={() => { setEditingPalette(null); setFormData({ id: '', name: '', colors: '' }); }} style={s.btnBack}>Annuler</button>}
                </div>
                <small style={{ color: '#8B7050', marginTop: '4px' }}>Entrez des codes hexa séparés par des virgules.</small>
            </form>

            <div style={s.grid}>
                {palettes.map(p => (
                    <div key={p.id} style={{ ...s.card, flexDirection: 'column', alignItems: 'flex-start', gap: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                            <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                <button onClick={() => { setEditingPalette(p); setFormData({ ...p, colors: p.colors.join(', ') }); }} style={s.iconBtn}>✏️</button>
                                <button onClick={() => handleDelete(p.id)} style={s.iconBtn}>🗑️</button>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: '4px', width: '100%' }}>
                            {p.colors.map((c, i) => (
                                <div key={i} style={{ flex: 1, height: '12px', background: c, borderRadius: '2px' }} title={c} />
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


function LandingAssetManager() {
    const [assets, setAssets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ asset_type: 'hero', image_url: '', title: '', title_en: '' });

    const fetchAssets = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('landing_assets').select('*').order('created_at', { ascending: false });
        setAssets(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchAssets(); }, [fetchAssets]);

    const handleSave = async (e) => {
        e.preventDefault();
        await supabase.from('landing_assets').insert([formData]);
        setFormData({ asset_type: 'hero', image_url: '', title: '', title_en: '' });
        fetchAssets();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer cet asset ?')) return;
        await supabase.from('landing_assets').delete().eq('id', id);
        fetchAssets();
    };

    return (
        <div>
            <form onSubmit={handleSave} style={s.inlineForm}>
                <select value={formData.asset_type} onChange={e => setFormData({ ...formData, asset_type: e.target.value })} style={s.input}>
                    <option value="hero_masonry">Hero Gallery (Grid)</option>
                    <option value="hero_comparison">Hero Comparison (Before/After)</option>
                    <option value="featured_creation">Latest Creations (Showcase)</option>
                </select>
                <input placeholder="URL de l'image" value={formData.image_url} onChange={e => setFormData({ ...formData, image_url: e.target.value })} style={{ ...s.input, flex: 2 }} required />
                <input placeholder="Titre (FR)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} style={s.input} />
                <input placeholder="Titre (EN)" value={formData.title_en} onChange={e => setFormData({ ...formData, title_en: e.target.value })} style={s.input} />
                <button type="submit" style={s.btnPrimary}>Ajouter</button>
            </form>

            <div style={s.grid}>
                {assets.map(asset => (
                    <div key={asset.id} style={{ ...s.card, flexDirection: 'column' }}>
                        <img src={asset.image_url} alt="" style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '4px' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginTop: '8px' }}>
                            <div style={{ fontSize: '12px' }}>
                                <strong>{asset.asset_type}</strong><br />
                                <span style={{ color: '#8B7050', fontSize: '11px' }}>FR: {asset.title}</span><br />
                                <span style={{ color: '#B8860B', fontSize: '11px' }}>EN: {asset.title_en}</span>
                            </div>
                            <button onClick={() => handleDelete(asset.id)} style={s.iconBtn}>🗑️</button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function TestimonialManager() {
    const [testimonials, setTestimonials] = useState([]);
    const [loading, setLoading] = useState(true);
    const [formData, setFormData] = useState({ user_name: '', user_role: '', user_role_en: '', content: '', content_en: '', rating: 5 });

    const fetchTestimonials = useCallback(async () => {
        setLoading(true);
        const { data } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
        setTestimonials(data || []);
        setLoading(false);
    }, []);

    useEffect(() => { fetchTestimonials(); }, [fetchTestimonials]);

    const handleSave = async (e) => {
        e.preventDefault();
        await supabase.from('testimonials').insert([formData]);
        setFormData({ user_name: '', user_role: '', user_role_en: '', content: '', content_en: '', rating: 5 });
        fetchTestimonials();
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Supprimer ce témoignage ?')) return;
        await supabase.from('testimonials').delete().eq('id', id);
        fetchTestimonials();
    };

    return (
        <div>
            <form onSubmit={handleSave} style={{ ...s.inlineForm, flexDirection: 'column' }}>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <input placeholder="Nom" value={formData.user_name} onChange={e => setFormData({ ...formData, user_name: e.target.value })} style={s.input} required />
                    <input type="number" min="1" max="5" value={formData.rating} onChange={e => setFormData({ ...formData, rating: parseInt(e.target.value) })} style={{ ...s.input, width: '60px' }} />
                </div>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <input placeholder="Rôle (FR)" value={formData.user_role} onChange={e => setFormData({ ...formData, user_role: e.target.value })} style={s.input} />
                    <input placeholder="Rôle (EN)" value={formData.user_role_en} onChange={e => setFormData({ ...formData, user_role_en: e.target.value })} style={s.input} />
                </div>
                <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                    <textarea placeholder="Contenu (FR)" value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} style={{ ...s.input, minHeight: '60px' }} required />
                    <textarea placeholder="Contenu (EN)" value={formData.content_en} onChange={e => setFormData({ ...formData, content_en: e.target.value })} style={{ ...s.input, minHeight: '60px' }} />
                </div>
                <button type="submit" style={s.btnPrimary}>Ajouter le témoignage</button>
            </form>

            <div style={s.grid}>
                {testimonials.map(t => (
                    <div key={t.id} style={{ ...s.card, flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                            <strong>{t.user_name}</strong>
                            <button onClick={() => handleDelete(t.id)} style={s.iconBtn}>🗑️</button>
                        </div>
                        <div style={{ fontSize: '12px', color: '#8B7050' }}>{t.user_role} - {t.rating}⭐</div>
                        <div style={{ fontSize: '13px', marginTop: '8px', fontStyle: 'italic' }}>"{t.content}"</div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const s = {
    container: {
        padding: '24px', background: '#0F0A06', borderRadius: '12px',
        border: '1px solid rgba(184, 134, 11, 0.2)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        margin: '20px auto', maxWidth: '1000px', color: '#F0E6D3'
    },
    header: {
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        marginBottom: '24px', borderBottom: '1px solid rgba(184, 134, 11, 0.2)', paddingBottom: '16px'
    },
    tabs: { display: 'flex', gap: '8px', marginBottom: '24px' },
    tab: {
        padding: '10px 20px', background: 'transparent', border: '1px solid #2A1A0E',
        color: '#8B7050', borderRadius: '4px', cursor: 'pointer', transition: 'all 0.3s'
    },
    activeTab: { background: 'rgba(184, 134, 11, 0.1)', color: '#B8860B', borderColor: '#B8860B' },
    content: { minHeight: '400px' },
    btnBack: { background: 'transparent', color: '#B8860B', border: '1px solid #B8860B', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer' },
    btnPrimary: { background: '#B8860B', color: '#0C0806', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' },
    inlineForm: { display: 'flex', gap: '10px', marginBottom: '24px', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' },
    input: { background: '#1A110A', border: '1px solid #3A2A1E', color: '#F0E6D3', padding: '10px', borderRadius: '4px', flex: 1 },
    grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' },
    card: {
        display: 'flex', alignItems: 'center', gap: '12px', padding: '16px',
        background: '#160E08', borderRadius: '8px', border: '1px solid rgba(184, 134, 11, 0.1)'
    },
    iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' }
};
