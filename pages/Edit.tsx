import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ApiService } from '../services/api';
import { ArrowLeft, Save } from 'lucide-react';

// Static component extraction to prevent re-render focus loss
const InputField = ({ label, name, value, onChange, type = "text", full = false }: any) => (
  <div className={`${full ? 'col-span-2' : ''}`}>
    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">{label}</label>
    {type === 'textarea' ? (
      <textarea 
        name={name} 
        value={value || ''} 
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
        rows={3}
      />
    ) : (
      <input 
        type="text" 
        name={name} 
        value={value || ''} 
        onChange={onChange}
        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
      />
    )}
  </div>
);

const SectionTitle = ({ title }: { title: string }) => (
  <div className="bg-slate-800 text-white px-4 py-2 font-bold text-sm uppercase tracking-wide mt-8 mb-4 rounded-md">
    {title}
  </div>
);

export const Edit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  useEffect(() => {
    if (id) {
      ApiService.getRecordById(id).then(r => {
        if (r) setFormData(r);
        setLoading(false);
      });
    }
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg({ type: '', text: '' });

    if (!id) return;
    
    // The server handles updating all fields sent in the body
    const success = await ApiService.updateRecord(id, formData);
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
    
    if (success) {
      setMsg({ type: 'success', text: 'Record updated successfully!' });
      setTimeout(() => navigate(`/details/${id}`), 2000);
    } else {
      setMsg({ type: 'error', text: 'Failed to update record.' });
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center p-10">Loading record...</div>;
  if (!formData.ID) return <div className="text-center p-10 text-red-500">Record not found.</div>;

  return (
    <div className="max-w-5xl mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/?tab=search" className="flex items-center text-gray-600 hover:text-gray-900 font-medium">
          <ArrowLeft size={18} className="mr-1" /> Cancel
        </Link>
        <div className="text-sm font-bold text-gray-500">Editing Record ID: {id}</div>
      </div>

      <div className="bg-white shadow-xl rounded-lg border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Edit Record</h1>
        <p className="text-gray-500 text-sm mb-6">Modify details below.</p>

        {msg.text && (
          <div className={`p-4 rounded mb-6 text-center font-medium ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {msg.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          <SectionTitle title="Identity" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Name of Node" name="NAME_OF_NODE" value={formData.NAME_OF_NODE} onChange={handleChange} />
             {/* Updated names: SECTOR_NO_, PLOT_NO_, SUB_PLOT_NO_ */}
             <InputField label="Sector No." name="SECTOR_NO_" value={formData.SECTOR_NO_} onChange={handleChange} /> 
             <InputField label="Block / Road Name" name="BLOCK_ROAD_NAME" value={formData.BLOCK_ROAD_NAME} onChange={handleChange} />
             <InputField label="Plot No." name="PLOT_NO_" value={formData.PLOT_NO_} onChange={handleChange} />
             <InputField label="Plot No. After Survey" name="PLOT_NO_AFTER_SURVEY" value={formData.PLOT_NO_AFTER_SURVEY} onChange={handleChange} />
             <InputField label="Sub Plot No." name="SUB_PLOT_NO_" value={formData.SUB_PLOT_NO_} onChange={handleChange} />
             <InputField label="UID" name="UID" value={formData.UID} onChange={handleChange} />
          </div>

          <SectionTitle title="Details & Owners" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Date of Allotment" name="DATE_OF_ALLOTMENT" value={formData.DATE_OF_ALLOTMENT} onChange={handleChange} />
             {/* NAME_OF_ORIGINAL_ALLOTTEE */}
             <InputField label="Original Allottee" name="NAME_OF_ORIGINAL_ALLOTTEE" value={formData.NAME_OF_ORIGINAL_ALLOTTEE} onChange={handleChange} />
             {/* PLOT_AREA_SQM_ & BUILTUP_AREA_SQM_ */}
             <InputField label="Plot Area (SQM)" name="PLOT_AREA_SQM_" value={formData.PLOT_AREA_SQM_} onChange={handleChange} />
             <InputField label="Builtup Area (SQM)" name="BUILTUP_AREA_SQM_" value={formData.BUILTUP_AREA_SQM_} onChange={handleChange} />
             <InputField label="Use (File)" name="USE_OF_PLOT_ACCORDING_TO_FILE" value={formData.USE_OF_PLOT_ACCORDING_TO_FILE} onChange={handleChange} />
             <InputField label="Map Area" name="MAP_AREA" value={formData.MAP_AREA} onChange={handleChange} />
             {/* TOTAL_PRICE_RS_ & RATE_SQM_ */}
             <InputField label="Total Price" name="TOTAL_PRICE_RS_" value={formData.TOTAL_PRICE_RS_} onChange={handleChange} />
             <InputField label="Rate (SQM)" name="RATE_SQM_" value={formData.RATE_SQM_} onChange={handleChange} />
             <InputField label="FSI" name="FSI" value={formData.FSI} onChange={handleChange} />
             {/* LEASE_TERM_YEARS_ */}
             <InputField label="Lease Term" name="LEASE_TERM_YEARS_" value={formData.LEASE_TERM_YEARS_} onChange={handleChange} />
             <InputField label="Occupancy Cert" name="OCCUPANCY_CERTIFICATE" value={formData.OCCUPANCY_CERTIFICATE} onChange={handleChange} />
             <InputField label="Commencement Cert" name="COMENCEMENT_CERTIFICATE" value={formData.COMENCEMENT_CERTIFICATE} onChange={handleChange} />
             <InputField label="Planning Use" name="PLANNING_USE" value={formData.PLANNING_USE} onChange={handleChange} />
             <InputField label="File Location" name="FILE_LOCATION" value={formData.FILE_LOCATION} onChange={handleChange} />
             {/* Department_Remark & INVESTIGATOR_REMARKS */}
             <InputField label="Department Remarks" name="Department_Remark" value={formData.Department_Remark} onChange={handleChange} type="textarea" full />
             <InputField label="Investigator Remarks" name="INVESTIGATOR_REMARKS" value={formData.INVESTIGATOR_REMARKS} onChange={handleChange} type="textarea" full />
          </div>

          <SectionTitle title="Transfers (2nd - 11th Owner)" />
          <div className="space-y-4">
             {Array.from({ length: 10 }, (_, i) => i + 2).map(n => {
                const suffix = n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH';
                const nameKey = `NAME_OF_${n}${suffix}_OWNER`;
                // New date key with underscore
                const dateKey = `_${n}${suffix}_OWNER_TRANSFER_DATE`;

                return (
                  <div key={n} className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-100 pb-4 last:border-0">
                     <InputField label={`${n}${suffix} Owner Name`} name={nameKey} value={formData[nameKey]} onChange={handleChange} />
                     <InputField label={`${n}${suffix} Transfer Date`} name={dateKey} value={formData[dateKey]} onChange={handleChange} />
                  </div>
                )
             })}
          </div>

          <SectionTitle title="Survey Info" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Total Area (SQM)" name="TOTAL_AREA_SQM" value={formData.TOTAL_AREA_SQM} onChange={handleChange} />
             <InputField label="Use of Plot" name="USE_OF_PLOT" value={formData.USE_OF_PLOT} onChange={handleChange} />
             <InputField label="Sub Use" name="SUB_USE_OF_PLOT" value={formData.SUB_USE_OF_PLOT} onChange={handleChange} />
             <InputField label="Plot Status" name="PLOT_STATUS" value={formData.PLOT_STATUS} onChange={handleChange} />
             {/* SURVEY_REMARKS */}
             <InputField label="Survey Remark" name="SURVEY_REMARKS" value={formData.SURVEY_REMARKS} onChange={handleChange} type="textarea" full />
             <InputField label="Photo Folder" name="PHOTO_FOLDER" value={formData.PHOTO_FOLDER} onChange={handleChange} />
          </div>

          <SectionTitle title="Quantities" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Plot Area (Invoice)" name="PLOT_AREA_FOR_INVOICE" value={formData.PLOT_AREA_FOR_INVOICE} onChange={handleChange} />
             <InputField label="Plot Use (Invoice)" name="PLOT_USE_FOR_INVOICE" value={formData.PLOT_USE_FOR_INVOICE} onChange={handleChange} />
             <InputField label="Tentative Plot Count" name="Tentative_Plot_Count" value={formData.Tentative_Plot_Count} onChange={handleChange} />
             <InputField label="Minimum Plot Count" name="Minimum_Plot_Count" value={formData.Minimum_Plot_Count} onChange={handleChange} />
             <InputField label="Additional Plot Count" name="Additional_Plot_Count" value={formData.Additional_Plot_Count} onChange={handleChange} />
             <InputField label="Percentage Match" name="Percentage_Match" value={formData.Percentage_Match} onChange={handleChange} />
          </div>

          <SectionTitle title="Extras" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             <InputField label="Submission" name="SUBMISSION" value={formData.SUBMISSION} onChange={handleChange} />
             <InputField label="Images Present" name="IMAGES_PRESENT" value={formData.IMAGES_PRESENT} onChange={handleChange} />
          </div>

          <div className="mt-10 flex gap-4 border-t pt-6">
             <button 
               type="submit" 
               disabled={saving}
               className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-indigo-700 transition flex items-center gap-2 disabled:opacity-50 shadow-lg"
             >
               <Save size={20} /> {saving ? 'Saving...' : 'Save Changes'}
             </button>
             <button 
               type="button" 
               onClick={() => navigate(`/details/${id}`)}
               className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition"
             >
               Cancel
             </button>
          </div>

        </form>
      </div>
    </div>
  );
};