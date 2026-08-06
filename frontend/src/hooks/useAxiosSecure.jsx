import axios from 'axios';
import { useEffect } from 'react';
import { toast } from 'react-toastify';
import Swal from 'sweetalert2';
import useAuth from './useAuth';
import { API_BASE_URL } from '../utils/apiConfig';

const axiosSecure = axios.create({
  baseURL: API_BASE_URL
});

const useAxiosSecure = () => {
  const { user, logOut } = useAuth()

  useEffect(() => {
    //intercept request
    const reqInterceptor = axiosSecure.interceptors.request.use(async (config) => {
      if (user) {
        try {
          const token = await user.getIdToken();
          config.headers.Authorization = `Bearer ${token}`;
        } catch (err) {
          console.error("Failed to retrieve fresh Firebase ID token", err);
          config.headers.Authorization = `Bearer ${user.accessToken}`;
        }
      }
      return config;
    });

    ///interceptor response
    const resInterceptor = axiosSecure.interceptors.response.use((response) => {
     
      return response
    }, async (error) => {
      // If there is no response, it likely means the request never reached the server (network error / server down)
      if (!error.response) {
        toast.error('Internal Server Error');
        return Promise.reject(error);
      }
      
      const { status } = error.response;
      if (status === 429) {
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
      }

      if (status === 401) {
        try {
          await logOut();
        } catch (logoutError) {
          console.error("Logout failed during interceptor", logoutError);
        }
        if (typeof window !== "undefined" && !window.location.pathname.startsWith("/auth")) {
          window.location.href = "/auth/login";
        }
      }

      return Promise.reject(error);

    })

    return () => {
      axiosSecure.interceptors.request.eject(reqInterceptor);
      axiosSecure.interceptors.response.eject(resInterceptor);

    }

  }, [user, logOut])
  return axiosSecure;
};

export default useAxiosSecure;