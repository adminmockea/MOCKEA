import { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { FiPlus, FiX, FiExternalLink, FiBookOpen, FiCheck, FiSlash, FiAlertCircle, FiUpload, FiLoader, FiCheckCircle } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import useAuth from '../../../hooks/useAuth';
import { useRole } from '../../../hooks/useRole';
import Swal from 'sweetalert2';
import useAdminQuery from '../../../hooks/useAdminQuery';
import useFormModal from '../../../hooks/useFormModal';
import PageHeader from '../../Common/PageHeader';
import TableShell from '../../Common/TableShell';
import AdminModal from '../../Common/AdminModal';
import HoverActions from '../../Common/HoverActions';
import { getFileUrl } from '../../../utils/apiConfig';

const CATEGORIES = ["Vocabulary", "Writing Guide", "Speaking Templates", "Study Tips", "General"];

const ManageResources = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { role, roleLoading } = useRole();
  const [editingResource, setEditingResource] = useState(null);

  const resourceFileRef = useRef(null);
  const coverFileRef = useRef(null);
  const [uploadingResource, setUploadingResource] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);

  const initialFormState = {
    title: '',
    description: '',
    ctaText: 'Download Free E-Book',
    link: '',
    imageUrl: '',
    category: 'General',
    fileType: 'PDF',
    size: '',
    status: 'Pending',
    isBook: true,
    isFeaturedOnRegister: false,
    examType: 'Both'
  };

  const { isOpen: isModalOpen, formData, setFormData, openModal, closeModal, handleChange } = useFormModal(initialFormState);

  const handleFileUpload = async (e, fieldType) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isCover = fieldType === 'cover';
    if (isCover) {
      setUploadingCover(true);
    } else {
      setUploadingResource(true);
    }

    const uploadData = new FormData();
    uploadData.append(isCover ? 'cover' : 'file', file);

    try {
      const res = await axiosSecure.post('/resources/upload', uploadData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data.success) {
        if (isCover) {
          setFormData(prev => ({ ...prev, imageUrl: res.data.url }));
          toast.success(`Cover image "${res.data.originalName}" uploaded successfully!`);
        } else {
          setFormData(prev => ({
            ...prev,
            link: res.data.url,
            fileType: res.data.fileType || prev.fileType,
            size: res.data.size || prev.size
          }));
          toast.success(`Resource file "${res.data.originalName}" uploaded successfully!`);
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to upload file to server');
    } finally {
      if (isCover) {
        setUploadingCover(false);
      } else {
        setUploadingResource(false);
      }
      e.target.value = '';
    }
  };


  // Toggle Featured Status Quick Action (Admin Only)
  const toggleFeaturedMutation = useMutation({
    mutationFn: ({ id, isFeaturedOnRegister }) => axiosSecure.put(`/resources/${id}`, { isFeaturedOnRegister }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-manage'] });
      toast.success('Updated featured book for Registration page!');
    },
    onError: () => toast.error('Failed to update featured book status')
  });

  // Fetch all resources for management (including pending/rejected)
  const { data: resources = [], isLoading } = useAdminQuery(
    ['resources-manage'],
    '/resources/manage',
    'resources'
  );

  // Create Resource Mutation
  const createMutation = useMutation({
    mutationFn: (newResource) => axiosSecure.post('/resources', newResource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-manage'] });
      if (role === 'admin') {
        toast.success('Resource created and published successfully!');
      } else {
        toast.success('Resource submitted successfully! Pending admin approval.');
      }
      handleCloseModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error creating resource')
  });

  // Update Resource Mutation
  const updateMutation = useMutation({
    mutationFn: (updatedResource) => axiosSecure.put(`/resources/${updatedResource._id}`, updatedResource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-manage'] });
      if (role === 'admin') {
        toast.success('Resource updated successfully');
      } else {
        toast.success('Resource modifications submitted! Pending admin approval.');
      }
      handleCloseModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error updating resource')
  });

  // Status Approval Quick Action Mutation (Admin Only)
  const statusMutation = useMutation({
    mutationFn: ({ id, status }) => axiosSecure.put(`/resources/${id}`, { status }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['resources-manage'] });
      toast.success(`Resource status updated to "${variables.status}" successfully!`);
    },
    onError: () => toast.error('Failed to update resource approval status')
  });

  // Delete Resource Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axiosSecure.delete(`/resources/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['resources-manage'] });
      toast.success('Resource deleted successfully');
    },
    onError: (error) => toast.error('Error deleting resource')
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this resource? This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#EF4444",
      cancelButtonColor: "#6B7280",
      confirmButtonText: "Yes, delete it!",
      background: "#ffffff",
      customClass: {
        popup: "rounded-[2rem]",
        confirmButton: "rounded-xl px-6 py-2.5 font-bold",
        cancelButton: "rounded-xl px-6 py-2.5 font-bold"
      }
    });

    if (result.isConfirmed) {
      deleteMutation.mutate(id);
    }
  };

  const handleOpenModal = (resource = null) => {
    if (resource) {
      setEditingResource(resource);
      openModal(resource);
    } else {
      setEditingResource(null);
      openModal({
        ...initialFormState,
        status: role === 'admin' ? 'Approved' : 'Pending'
      });
    }
  };

  const handleCloseModal = () => {
    setEditingResource(null);
    closeModal();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingResource) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (roleLoading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center text-slate-500 font-bold min-h-[50vh]">
        <div className="w-10 h-10 border-4 border-cta-btn border-t-transparent rounded-full animate-spin mb-4"></div>
        Verifying credentials...
      </div>
    );
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return <span className="bg-green-50 text-green-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-green-200">Approved</span>;
      case 'Pending':
        return <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-amber-200 animate-pulse">Pending Review</span>;
      case 'Rejected':
        return <span className="bg-red-50 text-red-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-red-200">Rejected</span>;
      default:
        return <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-slate-200">Unknown</span>;
    }
  };

  const handleShowTitleIfClipped = (e, title) => {
    const el = e.currentTarget;
    if (el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) {
      el.setAttribute("title", title);
    } else {
      el.removeAttribute("title");
    }
  };

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      {/* Header Panel */}
      <PageHeader
        title={`Manage Free Resources (${role === 'admin' ? 'Administrator' : 'Instructor'} Panel)`}
        subtitle={
          role === 'admin'
            ? 'Approve instructor uploads, publish new materials, or review existing study guides.'
            : 'Add useful templates or e-books. Admin review is required before they go live.'
        }
        icon={<FiBookOpen className="text-cta-btn" />}
        action={
          <button
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-cta-btn text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20 cursor-pointer"
          >
            <FiPlus />
            Add Resource
          </button>
        }
      />

      {/* Grid List Table */}
      <TableShell
        isLoading={isLoading}
        empty={resources.length === 0}
        emptyTitle="No resources found"
        emptyText="There are no resources registered on the platform yet."
        loadingText="Loading resources list..."
      >
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-bold border-b border-slate-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">Title</th>
                <th className="px-6 py-4">Category</th>
                <th className="px-6 py-4">Added By</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Downloads</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resources.map(res => (
                <tr key={res._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <img src={getFileUrl(res.imageUrl)} alt={res.title} className="w-10 h-10 object-cover rounded-lg shrink-0" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span 
                            className="font-bold text-slate-900 block line-clamp-1"
                            onMouseEnter={(e) => handleShowTitleIfClipped(e, res.title)}
                          >
                            {res.title}
                          </span>
                          {res.isFeaturedOnRegister && (
                            <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full border border-amber-200 shrink-0">
                              ⭐ Register Gift
                            </span>
                          )}
                        </div>
                        <a href={getFileUrl(res.link)} target="_blank" rel="noreferrer" className="text-xs text-blue-500 hover:underline inline-flex items-center gap-0.5 mt-0.5">
                          View Resource <FiExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-xs font-bold uppercase">
                      {res.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium text-slate-500 block max-w-[150px] truncate" title={res.addedBy}>
                      {res.addedBy === user?.email ? 'You' : res.addedBy}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {getStatusBadge(res.status)}
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-900">
                    {res.downloadCount?.toLocaleString() || 0}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <HoverActions
                      onEdit={() => handleOpenModal(res)}
                      onDelete={() => handleDelete(res._id)}
                      extra={role === 'admin' && res.status === 'Pending' && (
                        <>
                          <button
                            onClick={() => statusMutation.mutate({ id: res._id, status: 'Approved' })}
                            title="Approve Resource"
                            className="text-green-600 hover:text-white p-2 bg-green-50 hover:bg-green-600 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center mr-1"
                          >
                            <FiCheck className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => statusMutation.mutate({ id: res._id, status: 'Rejected' })}
                            title="Reject Resource"
                            className="text-red-500 hover:text-white p-2 bg-red-50 hover:bg-red-500 rounded-lg transition-colors cursor-pointer inline-flex items-center justify-center mr-1"
                          >
                            <FiSlash className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </TableShell>

      {/* Resource Form Modal */}
      <AdminModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingResource ? 'Edit Resource' : 'Add New Resource'}
        footer={
          <>
            <button onClick={handleCloseModal} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors cursor-pointer">
              Cancel
            </button>
            <button type="submit" form="resource-form" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2.5 bg-cta-btn hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-colors disabled:opacity-50 cursor-pointer">
              {editingResource ? 'Submit Changes' : 'Submit Resource'}
            </button>
          </>
        }
      >
        <form id="resource-form" onSubmit={handleSubmit} className="space-y-6">
          {role === 'instructor' && (
            <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4 flex items-start gap-3">
              <FiAlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-700 font-medium leading-relaxed">
                All new submissions or edits by instructors are queued for administrator review. Your resource will go live immediately once approved.
              </p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Resource Title *</label>
              <input type="text" name="title" required value={formData.title} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. Master Writing Task 1 templates" />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Description *</label>
              <textarea rows="3" name="description" required value={formData.description} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all resize-none" placeholder="Enter a brief, compelling description of this resource..." />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Category *</label>
              <select name="category" required value={formData.category} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all bg-white">
                {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">CTA Button Text *</label>
              <input type="text" name="ctaText" required value={formData.ctaText} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. Download PDF" />
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Download / Resource Link or File *</label>
                <button
                  type="button"
                  onClick={() => resourceFileRef.current?.click()}
                  disabled={uploadingResource}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-cta-btn hover:text-red-700 bg-red-50 hover:bg-red-100 px-3 py-1 rounded-lg border border-red-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingResource ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Uploading File...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-3.5 h-3.5" /> Upload File to Server
                    </>
                  )}
                </button>
                <input
                  type="file"
                  ref={resourceFileRef}
                  onChange={(e) => handleFileUpload(e, 'resource')}
                  className="hidden"
                />
              </div>
              <input
                type="text"
                name="link"
                required
                value={formData.link}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all text-slate-800"
                placeholder="https://example.com/file.pdf or click 'Upload File to Server'"
              />
              {formData.link?.startsWith('/uploads/') && (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5" /> File saved on server filesystem
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-semibold text-slate-700">Cover Image URL or File *</label>
                <button
                  type="button"
                  onClick={() => coverFileRef.current?.click()}
                  disabled={uploadingCover}
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-3 py-1 rounded-lg border border-blue-200 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {uploadingCover ? (
                    <>
                      <FiLoader className="w-3.5 h-3.5 animate-spin" /> Uploading Cover...
                    </>
                  ) : (
                    <>
                      <FiUpload className="w-3.5 h-3.5" /> Upload Cover Image
                    </>
                  )}
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={coverFileRef}
                  onChange={(e) => handleFileUpload(e, 'cover')}
                  className="hidden"
                />
              </div>
              <input
                type="text"
                name="imageUrl"
                required
                value={formData.imageUrl}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all text-slate-800"
                placeholder="https://images.unsplash.com/... or click 'Upload Cover Image'"
              />
              {formData.imageUrl?.startsWith('/uploads/') && (
                <p className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                  <FiCheckCircle className="w-3.5 h-3.5" /> Cover image saved on server filesystem
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">File Type *</label>
              <input type="text" name="fileType" required value={formData.fileType} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. PDF" />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">Exam Target *</label>
              <select name="examType" value={formData.examType || 'Both'} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all bg-white font-semibold">
                <option value="Both">Both (PTE & IELTS)</option>
                <option value="PTE">PTE Academic Only</option>
                <option value="IELTS">IELTS Academic Only</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-1.5">File Size (Optional)</label>
              <input type="text" name="size" value={formData.size} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. 2.4 MB" />
            </div>

            <div className="md:col-span-2 bg-blue-50 border border-blue-100 rounded-2xl p-4 flex items-center justify-between">
              <div>
                <span className="block text-sm font-extrabold text-blue-900">⭐ Feature on Register Page</span>
                <span className="text-xs text-blue-700">Display this book as the free download gift on the User Registration page.</span>
              </div>
              <input
                type="checkbox"
                name="isFeaturedOnRegister"
                checked={!!formData.isFeaturedOnRegister}
                onChange={(e) => setFormData(prev => ({ ...prev, isFeaturedOnRegister: e.target.checked }))}
                className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 border-gray-300 cursor-pointer accent-blue-600 shrink-0"
              />
            </div>

            {role === 'admin' ? (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Approval Status *</label>
                <select name="status" required value={formData.status} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all bg-white font-bold text-slate-800">
                  <option value="Approved">Approved (Publicly Visible)</option>
                  <option value="Pending">Pending (Awaiting Review)</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            ) : (
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">Approval Status</label>
                <div className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-slate-500 font-bold text-sm">
                  {formData.status || 'Pending'}
                </div>
              </div>
            )}
          </div>
        </form>
      </AdminModal>
    </div>
  );
};

export default ManageResources;
