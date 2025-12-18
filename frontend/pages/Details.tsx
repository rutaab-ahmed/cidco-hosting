import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ApiService } from '../services/api';
import { PlotRecord } from '../types';
import { ArrowLeft, FileText, Map, Image as ImageIcon } from 'lucide-react';
import { ImageViewer } from '../components/ImageViewer';

export const Details: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [record, setRecord] = useState<PlotRecord | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Image Viewer State
  const [isViewerOpen, setIsViewerOpen] = useState(false);
  const [currentImage, setCurrentImage] = useState('');

  useEffect(() => {
    if (id) {
      ApiService.getRecordById(id).then(r => {
        setRecord(r || null);
        setLoading(false);
      });
    }
  }, [id]);

  const openImage = (src: string) => {
    setCurrentImage(src);
    setIsViewerOpen(true);
  };

  const openFile = (type: 'pdf' | 'map') => {
    if (!record) return;
    const folder = type === 'pdf' ? 'pdfs' : 'maps';
    const url = ` https://sleepier-undeparted-audrie.ngrok-free.dev/uploads/${folder}/${record.ID}.pdf`;
    window.open(url, '_blank');
  };

  if (loading) return <div className="text-center p-10">Loading record details...</div>;
  if (!record) return <div className="text-center p-10 text-red-500">Record not found.</div>;

  const DetailRow = ({ label, value, label2, value2 }: any) => (
    <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100 last:border-0">
      <div className="flex border-b md:border-b-0 md:border-r border-gray-100">
        <div className="w-1/3 bg-gray-50 p-3 text-xs font-semibold text-gray-500 uppercase flex items-center">{label}</div>
        <div className="w-2/3 p-3 text-sm text-gray-800 break-words">{value || '—'}</div>
      </div>
      <div className="flex">
        <div className="w-1/3 bg-gray-50 p-3 text-xs font-semibold text-gray-500 uppercase flex items-center">{label2}</div>
        <div className="w-2/3 p-3 text-sm text-gray-800 break-words">{value2 || '—'}</div>
      </div>
    </div>
  );

  const SectionTitle = ({ title }: { title: string }) => (
    <div className="bg-slate-800 text-white px-4 py-2 font-bold text-sm uppercase tracking-wide mt-6 first:mt-0 rounded-t-md">
      {title}
    </div>
  );

  const getOwnerData = (n: number) => {
    const suffix = n === 2 ? 'ND' : n === 3 ? 'RD' : 'TH';
    const nameKey = `NAME_OF_${n}${suffix}_OWNER`;
    // New Column Format: _2ND_OWNER_TRANSFER_DATE
    const dateKey = `_${n}${suffix}_OWNER_TRANSFER_DATE`;
    
    return { 
      name: record[nameKey], 
      date: record[dateKey] 
    };
  };

  return (
    <div className="max-w-6xl mx-auto pb-10">
      <div className="mb-6 flex items-center justify-between">
        <Link to="/?tab=search" className="flex items-center text-indigo-600 hover:text-indigo-800 font-medium">
          <ArrowLeft size={18} className="mr-1" /> Back to Search
        </Link>
        <div className="text-sm text-gray-500">Record ID: {record.ID}</div>
      </div>

      <div className="bg-white shadow-md rounded-lg overflow-hidden border border-gray-200">
        
        {/* IDENTITY */}
        <SectionTitle title="Identity of Plot" />
        <DetailRow label="ID" value={record.ID} label2="Name of Node" value2={record.NAME_OF_NODE} />
        {/* SECTOR_NO_ & PLOT_NO_ & SUB_PLOT_NO_ */}
        <DetailRow label="Sector No." value={record.SECTOR_NO_} label2="Block / Road Name" value2={record.BLOCK_ROAD_NAME} />
        <DetailRow label="Plot No." value={record.PLOT_NO_} label2="Plot No. After Survey" value2={record.PLOT_NO_AFTER_SURVEY} />
        <DetailRow label="Sub Plot No." value={record.SUB_PLOT_NO_} label2="UID" value2={record.UID} />

        {/* DETAILS */}
        <SectionTitle title="Details of Plot & Owners" />
        {/* NAME_OF_ORIGINAL_ALLOTTEE */}
        <DetailRow label="Date of Allotment" value={record.DATE_OF_ALLOTMENT} label2="Original Allottee" value2={record.NAME_OF_ORIGINAL_ALLOTTEE} />
        {/* PLOT_AREA_SQM_ & BUILTUP_AREA_SQM_ */}
        <DetailRow label="Plot Area (SQM)" value={record.PLOT_AREA_SQM_} label2="Builtup Area (SQM)" value2={record.BUILTUP_AREA_SQM_} />
        <DetailRow label="Use (File)" value={record.USE_OF_PLOT_ACCORDING_TO_FILE} label2="Map Area" value2={record.MAP_AREA} />
        {/* TOTAL_PRICE_RS_ & RATE_SQM_ */}
        <DetailRow label="Total Price (RS)" value={record.TOTAL_PRICE_RS_} label2="Rate (SQM)" value2={record.RATE_SQM_} />
        {/* LEASE_TERM_YEARS_ */}
        <DetailRow label="FSI" value={record.FSI} label2="Lease Term (Yrs)" value2={record.LEASE_TERM_YEARS_} />
        <DetailRow label="Occupancy Cert" value={record.OCCUPANCY_CERTIFICATE} label2="Commencement Cert" value2={record.COMENCEMENT_CERTIFICATE} />
        <DetailRow label="Planning Use" value={record.PLANNING_USE} label2="File Location" value2={record.FILE_LOCATION} />
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
           <div className="p-3">
             {/* Department_Remark */}
             <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Department Remarks</div>
             <div className="text-sm bg-gray-50 p-2 rounded">{record.Department_Remark || '—'}</div>
           </div>
           <div className="p-3 border-l border-gray-100">
             {/* INVESTIGATOR_REMARKS */}
             <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Investigator Remarks</div>
             <div className="text-sm bg-gray-50 p-2 rounded">{record.INVESTIGATOR_REMARKS || '—'}</div>
           </div>
        </div>

        {/* TRANSFERS */}
        <SectionTitle title="Transfer Details in Chronological Order" />
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-100 text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-4 py-2 w-1/4">Ownership</th>
                <th className="px-4 py-2 w-1/2">Name</th>
                <th className="px-4 py-2 w-1/4">Date of Transfer</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {Array.from({ length: 10 }, (_, i) => i + 2).map(n => {
                const suffix = n === 2 ? 'nd' : n === 3 ? 'rd' : 'th';
                const { name, date } = getOwnerData(n);
                return (
                  <tr key={n}>
                    <td className="px-4 py-2 font-medium text-gray-700">{n}{suffix} Owner</td>
                    <td className="px-4 py-2 text-gray-600 font-semibold">{name || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{date || '—'}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* SURVEY */}
        <SectionTitle title="Survey Information" />
        <DetailRow label="Total Area (SQM)" value={record.TOTAL_AREA_SQM} label2="Use of Plot" value2={record.USE_OF_PLOT} />
        <DetailRow label="Sub Use" value={record.SUB_USE_OF_PLOT} label2="Status" value2={record.PLOT_STATUS} />
        <div className="p-3 border-b border-gray-100">
           {/* SURVEY_REMARKS */}
           <div className="text-xs font-semibold text-gray-500 uppercase mb-1">Survey Remark</div>
           <div className="text-sm text-gray-800">{record.SURVEY_REMARKS || '—'}</div>
        </div>
        
        {/* QUANTITY */}
        <SectionTitle title="Quantity Calculation Details" />
        <DetailRow label="Plot Area for Invoice" value={record.PLOT_AREA_FOR_INVOICE} label2="Plot Use for Invoice" value2={record.PLOT_USE_FOR_INVOICE} />
        <DetailRow label="Tentative Plot Count" value={record.Tentative_Plot_Count} label2="Minimum Plot Count" value2={record.Minimum_Plot_Count} />
        <div className="grid grid-cols-1 md:grid-cols-2 border-b border-gray-100">
           <div className="flex border-b md:border-b-0 md:border-r border-gray-100">
             <div className="w-1/3 bg-gray-50 p-3 text-xs font-semibold text-gray-500 uppercase flex items-center">Additional Plot Count</div>
             <div className="w-2/3 p-3 text-sm text-gray-800 break-words">{record.Additional_Plot_Count || '—'}</div>
           </div>
        </div>
      
        {/* IMAGES & FILES */}
        <SectionTitle title="Files & Images" />
        <div className="p-6 bg-gray-50">
           <h4 className="font-semibold mb-4 text-gray-700 flex items-center gap-2"><ImageIcon size={16}/> Site Images</h4>
           {record.images && record.images.length > 0 ? (
             <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
               {record.images.map((img, idx) => (
                 <div key={idx} className="group relative aspect-square bg-gray-200 rounded-lg overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition" onClick={() => openImage(img)}>
                    <img src={img} alt={`Plot ${idx}`} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                       <span className="text-white opacity-0 group-hover:opacity-100 font-semibold text-sm">View</span>
                    </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="text-gray-400 italic mb-6">No images available.</div>
           )}

           <div className="flex gap-4">
             {record.has_pdf ? (
               <button onClick={() => openFile('pdf')} className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition">
                 <FileText size={16} /> View PDF
               </button>
             ) : (
               <span className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded cursor-not-allowed">
                 <FileText size={16} /> No PDF
               </span>
             )}
             
             {record.has_map ? (
               <button onClick={() => openFile('map')} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">
                 <Map size={16} /> View Map
               </button>
             ) : (
               <span className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-400 rounded cursor-not-allowed">
                 <Map size={16} /> No Map
               </span>
             )}
           </div>
        </div>

      </div>

      <ImageViewer src={currentImage} isOpen={isViewerOpen} onClose={() => setIsViewerOpen(false)} />
    </div>
  );
};
