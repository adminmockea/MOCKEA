import axios from 'axios';
import { API_BASE_URL } from '../utils/apiConfig';

const axiosInstance = axios.create({
  baseURL: API_BASE_URL,
});

// Intercept responses globally for public routes to catch 429 rate limit exceptions
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 429) {
      import('sweetalert2').then(({ default: Swal }) => {
        Swal.fire({
          title: "Slow Down!",
          text: error.response.data?.message || "You are sending requests too quickly. Please wait a moment and try again.",
          icon: "warning",
          confirmButtonColor: "#3B82F6",
          background: "#ffffff",
          customClass: {
            popup: "rounded-[2rem]",
            confirmButton: "rounded-xl px-6 py-2.5 font-bold"
          }
        });
      });
    }
    return Promise.reject(error);
  }
);

const useAxios = () => {
    return axiosInstance;
};

export default useAxios;