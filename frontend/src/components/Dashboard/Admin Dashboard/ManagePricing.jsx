import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FiEdit2, FiTrash2, FiPlus, FiX } from 'react-icons/fi';
import { toast } from 'react-toastify';
import useAxiosSecure from '../../../hooks/useAxiosSecure';
import Swal from 'sweetalert2';

const ManagePricing = () => {
  const axiosSecure = useAxiosSecure();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  const initialFormState = {
    priceId: '',
    name: '',
    subtitle: '',
    price: '',
    bdtPrice: '',
    duration: '',
    features: [''],
    isPopular: false,
    CtaBtn: ''
  };

  const [formData, setFormData] = useState(initialFormState);

  // Fetch Pricing Plans
  const { data: plans = [], isLoading } = useQuery({
    queryKey: ['pricing'],
    queryFn: async () => {
      const res = await axiosSecure.get('/pricing');
      return res.data.pricing;
    }
  });

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: (newPlan) => axiosSecure.post('/pricing', newPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success('Pricing plan created successfully');
      closeModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error creating plan')
  });

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (updatedPlan) => axiosSecure.put(`/pricing/${updatedPlan._id}`, updatedPlan),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success('Pricing plan updated successfully');
      closeModal();
    },
    onError: (error) => toast.error(error.response?.data?.message || 'Error updating plan')
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: (id) => axiosSecure.delete(`/pricing/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing'] });
      toast.success('Pricing plan deleted successfully');
    },
    onError: () => toast.error('Error deleting plan')
  });

  const handleDelete = async (id) => {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: "Are you sure you want to delete this plan? This action cannot be undone.",
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

  const handleOpenModal = (plan = null) => {
    if (plan) {
      setEditingPlan(plan);
      setFormData({
        ...plan,
        bdtPrice: plan.bdtPrice || ''
      });
    } else {
      setEditingPlan(null);
      setFormData(initialFormState);
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPlan(null);
    setFormData(initialFormState);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : (name === 'priceId' ? Number(value) : value)
    }));
  };

  const handleFeatureChange = (index, value) => {
    const newFeatures = [...formData.features];
    newFeatures[index] = value;
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const addFeatureField = () => {
    setFormData(prev => ({ ...prev, features: [...prev.features, ''] }));
  };

  const removeFeatureField = (index) => {
    const newFeatures = formData.features.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, features: newFeatures }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editingPlan) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  if (isLoading) return <div className="p-8 text-center text-slate-500">Loading pricing plans...</div>;

  return (
    <div className="p-6 md:p-10 max-w-7xl mx-auto space-y-8">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Manage Pricing Plans</h1>
          <p className="text-slate-500 mt-1 text-sm">Create, edit, or delete pricing tiers.</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-cta-btn text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-colors shadow-lg shadow-red-500/20"
        >
          <FiPlus />
          Add Plan
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-slate-700 font-semibold border-b border-slate-100 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Price / Duration</th>
                <th className="px-6 py-4">BDT Price (BD)</th>
                <th className="px-6 py-4">Popular</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {plans.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-8 text-center text-slate-500">No pricing plans found.</td>
                </tr>
              ) : (
                plans.map(plan => (
                  <tr key={plan._id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-900">{plan.priceId}</td>
                    <td className="px-6 py-4 font-semibold text-slate-900">{plan.name}</td>
                    <td className="px-6 py-4">{plan.price} <span className="text-slate-400 text-xs">/ {plan.duration}</span></td>
                    <td className="px-6 py-4 font-bold text-slate-800">
                      {plan.bdtPrice ? (
                        <span className="text-emerald-600 font-extrabold">{plan.bdtPrice}</span>
                      ) : (
                        <span className="text-slate-500 font-medium">
                          {plan.name?.toLowerCase().includes('standard') || plan.name?.toLowerCase().includes('essential')
                            ? 'BDT 1289tk (Default)'
                            : plan.name?.toLowerCase().includes('premium') || plan.name?.toLowerCase().includes('elite') || plan.isPopular
                            ? 'BDT 2989tk (Default)'
                            : 'Free'}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {plan.isPopular ? (
                        <span className="bg-green-100 text-green-700 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">Yes</span>
                      ) : (
                        <span className="bg-slate-100 text-slate-500 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider">No</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right space-x-3">
                      <button onClick={() => handleOpenModal(plan)} className="text-blue-500 hover:text-blue-700 transition-colors p-2 bg-blue-50 hover:bg-blue-100 rounded-lg">
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDelete(plan._id)} 
                        className="text-red-500 hover:text-red-700 transition-colors p-2 bg-red-50 hover:bg-red-100 rounded-lg"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-2xl my-8 relative flex flex-col max-h-[90vh]">
            <div className="flex justify-between items-center p-6 border-b border-slate-100 sticky top-0 bg-white rounded-t-3xl z-10">
              <h2 className="text-2xl font-black text-slate-900">{editingPlan ? 'Edit Pricing Plan' : 'Add New Plan'}</h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 p-2 rounded-full transition-colors">
                <FiX className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="pricing-form" onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price ID (Number) *</label>
                    <input type="number" name="priceId" required value={formData.priceId} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Name *</label>
                    <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Subtitle *</label>
                    <input type="text" name="subtitle" required value={formData.subtitle} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. KICKSTART YOUR PREP" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Price (USD / Default) *</label>
                    <input type="text" name="price" required value={formData.price} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. Free or $19" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">BDT Price (Bangladesh Users)</label>
                    <input type="text" name="bdtPrice" value={formData.bdtPrice || ''} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. BDT 1289tk or BDT 2989tk" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Duration *</label>
                    <input type="text" name="duration" required value={formData.duration} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" placeholder="e.g. Unlimited or 30 days" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">CTA Button Text *</label>
                    <input type="text" name="CtaBtn" required value={formData.CtaBtn} onChange={handleChange} className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all" />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-3 cursor-pointer p-4 bg-slate-50 border border-slate-200 rounded-xl hover:bg-slate-100 transition-colors">
                    <input type="checkbox" name="isPopular" checked={formData.isPopular} onChange={handleChange} className="w-5 h-5 rounded text-cta-btn focus:ring-cta-btn cursor-pointer" />
                    <span className="font-semibold text-slate-700">Mark as Most Popular Plan</span>
                  </label>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-3">Features</label>
                  <div className="space-y-3">
                    {formData.features.map((feature, index) => (
                      <div key={index} className="flex items-center gap-2">
                        <input
                          type="text"
                          required
                          value={feature}
                          onChange={(e) => handleFeatureChange(index, e.target.value)}
                          className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 focus:border-cta-btn focus:ring-2 focus:ring-cta-btn/20 outline-none transition-all"
                          placeholder="Feature description"
                        />
                        {formData.features.length > 1 && (
                          <button type="button" onClick={() => removeFeatureField(index)} className="p-3 text-red-500 bg-red-50 hover:bg-red-100 rounded-xl transition-colors">
                            <FiX className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button type="button" onClick={addFeatureField} className="text-sm font-semibold text-cta-btn bg-red-50 px-4 py-2 rounded-lg hover:bg-red-100 transition-colors flex items-center gap-1 mt-2">
                      <FiPlus className="w-4 h-4" /> Add Feature
                    </button>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 flex justify-end gap-3 sticky bottom-0 bg-white rounded-b-3xl z-10">
              <button onClick={closeModal} className="px-6 py-2.5 text-slate-600 font-semibold hover:bg-slate-100 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" form="pricing-form" disabled={createMutation.isPending || updateMutation.isPending} className="px-6 py-2.5 bg-cta-btn hover:bg-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 transition-colors disabled:opacity-50">
                {editingPlan ? 'Update Plan' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagePricing;
