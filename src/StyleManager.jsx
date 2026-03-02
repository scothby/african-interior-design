import React, { useState, useEffect, useCallback } from 'react';

const API_BASE_URL = 'http://localhost:5000';

export default function StyleManager({ onBack }) {
    const [styles, setStyles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [currentStyle, setCurrentStyle] = useState(null);

    // Form state
    const [formData, setFormData] = useState({
        name: '',
        region: 'Toutes',
        family: 'Moderne',
        description: '',
        prompt: '',
        materials: '',
        colors: '',
        patterns: '',
        flag: '🌍'
    });

    const fetchStyles = useCallback(async () => {
        try {
            setLoading(true);
            const res = await fetch(`${API_BASE_URL}/api/styles`);
            if (!res.ok) throw new Error('Erreur chargement des styles');
            const data = await res.json();
            setStyles(data.styles || []);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStyles();
    }, [fetchStyles]);

    const handleDelete = async (id) => {
        if (!window.confirm("Êtes-vous sûr de vouloir supprimer ce style ?")) return;
        try {
            const res = await fetch(`${API_BASE_URL}/api/styles/${id}`, { method: 'DELETE' });
            if (!res.ok) throw new Error('Suppression impossible');
            setStyles(prev => prev.filter(s => s.id !== id));
        } catch (err) {
            alert(err.message);
        }
    };

    const handleEdit = (style) => {
        setCurrentStyle(style);
        setFormData({
            name: style.name || '',
            region: style.region || '',
            family: style.family || '',
            description: style.description || '',
            prompt: style.prompt || '',
            materials: style.materials ? style.materials.join(', ') : '',
            colors: style.colors ? style.colors.join(', ') : '',
            patterns: style.patterns ? style.patterns.join(', ') : '',
            flag: style.flag || '🌍'
        });
        setIsEditing(true);
    };

    const handleAddNew = () => {
        setCurrentStyle(null);
        setFormData({
            name: '', region: 'Ouest', family: 'Traditionnel', description: '', prompt: '', materials: '', colors: '', patterns: '', flag: '🌍'
        });
        setIsEditing(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            // Parse comma separated fields
            const parsedData = {
                ...formData,
                materials: formData.materials.split(',').map(s => s.trim()).filter(Boolean),
                colors: formData.colors.split(',').map(s => s.trim()).filter(Boolean),
                patterns: formData.patterns.split(',').map(s => s.trim()).filter(Boolean),
            };

            const url = currentStyle ? `${API_BASE_URL}/api/styles/${currentStyle.id}` : `${API_BASE_URL}/api/styles`;
            const method = currentStyle ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(parsedData)
            });

            if (!res.ok) throw new Error("Erreur d'enregistrement");

            await fetchStyles();
            setIsEditing(false);
        } catch (err) {
            alert(err.message);
        }
    };

    if (isEditing) {
        return (
            <div style={s.container}>
                <div style={s.header}>
                    <h2>{currentStyle ? 'Modifier le Style' : 'Créer un Nouveau Style'}</h2>
                    <button onClick={() => setIsEditing(false)} style={s.btnDanger}>Annuler</button>
                </div>
                <form onSubmit={handleSave} style={s.form}>
                    <div style={s.formGroup}>
                        <label style={s.label}>Nom du style *</label>
                        <input required style={s.input} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} placeholder="Ex: Maison Massaï" />
                    </div>
                    <div style={s.formRow}>
                        <div style={s.formGroup}>
                            <label style={s.label}>Région (ex: Ouest, Est, Centrale...)</label>
                            <input style={s.input} value={formData.region} onChange={e => setFormData({ ...formData, region: e.target.value })} />
                        </div>
                        <div style={s.formGroup}>
                            <label style={s.label}>Famille (ex: Traditionnel, Moderne...)</label>
                            <input style={s.input} value={formData.family} onChange={e => setFormData({ ...formData, family: e.target.value })} />
                        </div>
                        <div style={s.formGroup}>
                            <label style={s.label}>Émoji / Drapeau</label>
                            <input style={s.input} value={formData.flag} onChange={e => setFormData({ ...formData, flag: e.target.value })} />
                        </div>
                    </div>
                    <div style={s.formGroup}>
                        <label style={s.label}>Description (Public)</label>
                        <textarea style={s.textarea} value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description affichée à l'utilisateur..." />
                    </div>
                    <div style={s.formGroup}>
                        <label style={s.label}>Instructions IA / Prompt * (Secret)</label>
                        <textarea required style={{ ...s.textarea, fontFamily: 'monospace', borderColor: '#B8860B' }} value={formData.prompt} onChange={e => setFormData({ ...formData, prompt: e.target.value })} placeholder="Prompt en anglais pour Midjourney/Gemini..." rows={5} />
                        <small style={s.hint}>Le prompt secret envoyé à l'IA pour générer ce style précis.</small>
                    </div>
                    <div style={s.formGroup}>
                        <label style={s.label}>Matériaux (séparés par des virgules)</label>
                        <input style={s.input} value={formData.materials} onChange={e => setFormData({ ...formData, materials: e.target.value })} placeholder="Bois, Argile, Bronze..." />
                    </div>
                    <div style={s.formGroup}>
                        <label style={s.label}>Couleurs (séparées par des virgules)</label>
                        <input style={s.input} value={formData.colors} onChange={e => setFormData({ ...formData, colors: e.target.value })} placeholder="#C84B31, #2D4263, Ochre..." />
                    </div>
                    <button type="submit" style={s.btnPrimary}>💾 Enregistrer le Style</button>
                </form>
            </div>
        );
    }

    return (
        <div style={s.container}>
            <div style={s.header}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <button onClick={onBack} style={s.btnBack}>← Retour</button>
                    <h2>⚙️ Gestion des Styles ({styles.length})</h2>
                </div>
                <button onClick={handleAddNew} style={s.btnPrimary}>+ Ajouter un Style</button>
            </div>

            {loading ? (
                <div style={{ padding: '40px', textAlign: 'center', color: '#B8860B' }}>Chargement...</div>
            ) : error ? (
                <div style={{ padding: '20px', color: '#ff4444' }}>{error}</div>
            ) : (
                <div style={s.tableContainer}>
                    <table style={s.table}>
                        <thead>
                            <tr>
                                <th style={s.th}>Nom</th>
                                <th style={s.th}>Région</th>
                                <th style={s.th}>Famille</th>
                                <th style={s.th}>Prompt</th>
                                <th style={s.th}>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {styles.map(style => (
                                <tr key={style.id} style={s.tr}>
                                    <td style={s.td}><strong>{style.flag} {style.name}</strong></td>
                                    <td style={s.td}><span style={s.badge}>{style.region}</span></td>
                                    <td style={s.td}>{style.family}</td>
                                    <td style={s.td}><span style={s.promptPreview}>{style.prompt?.substring(0, 40)}...</span></td>
                                    <td style={s.td}>
                                        <button onClick={() => handleEdit(style)} style={s.btnEdit}>✏️</button>
                                        <button onClick={() => handleDelete(style.id)} style={s.btnDelete}>🗑️</button>
                                    </td>
                                </tr>
                            ))}
                            {styles.length === 0 && (
                                <tr><td colSpan="5" style={{ ...s.td, textAlign: 'center' }}>Aucun style configuré.</td></tr>
                            )}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

const s = {
    container: {
        padding: '24px',
        background: '#0F0A06',
        borderRadius: '12px',
        border: '1px solid rgba(184, 134, 11, 0.2)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
        margin: '20px auto',
        maxWidth: '1000px',
        color: '#F0E6D3'
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        borderBottom: '1px solid rgba(184, 134, 11, 0.2)',
        paddingBottom: '16px'
    },
    btnPrimary: {
        background: '#B8860B', color: '#0C0806', border: 'none', padding: '10px 20px', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold'
    },
    btnDanger: {
        background: 'transparent', color: '#ff4444', border: '1px solid #ff4444', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
    },
    btnBack: {
        background: 'transparent', color: '#B8860B', border: '1px solid #B8860B', padding: '8px 16px', borderRadius: '4px', cursor: 'pointer'
    },
    btnEdit: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px', marginRight: '8px' },
    btnDelete: { background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '16px' },
    tableContainer: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    th: { textAlign: 'left', padding: '12px', color: '#B8860B', borderBottom: '2px solid rgba(184, 134, 11, 0.2)' },
    td: { padding: '12px', borderBottom: '1px solid rgba(255,255,255,0.05)' },
    tr: { ':hover': { background: 'rgba(255,255,255,0.02)' } },
    badge: { background: 'rgba(184, 134, 11, 0.1)', color: '#D4C3A3', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' },
    promptPreview: { color: '#8B7050', fontFamily: 'monospace', fontSize: '12px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '4px' },
    form: { display: 'flex', flexDirection: 'column', gap: '16px' },
    formRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' },
    formGroup: { display: 'flex', flexDirection: 'column', gap: '4px' },
    label: { fontSize: '13px', color: '#B8860B', fontWeight: 'bold' },
    input: { background: '#1A110A', border: '1px solid #3A2A1E', color: '#F0E6D3', padding: '10px', borderRadius: '4px', fontFamily: 'inherit' },
    textarea: { background: '#1A110A', border: '1px solid #3A2A1E', color: '#F0E6D3', padding: '10px', borderRadius: '4px', fontFamily: 'inherit', minHeight: '80px', resize: 'vertical' },
    hint: { fontSize: '11px', color: '#8B7050' }
};
