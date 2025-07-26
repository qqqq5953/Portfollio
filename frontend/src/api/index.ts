import axios, { type AxiosRequestConfig } from "axios"

export const fetcher = {
  get: async <ApiResponse>(
    url: string,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse> => {
    const response = await axios.get(url, config)
    return response.data
  },
  post: async <Data, ApiResponse>(
    url: string,
    data?: Data,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse> => {
    const response = await axios.post(url, data, config)
    return response.data
  },
  put: async <Data, ApiResponse>(
    url: string,
    data?: Data,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse> => {
    const response = await axios.put(url, data, config)
    return response.data
  },
  delete: async <Data, ApiResponse>(
    url: string,
    data?: Data,
    config?: AxiosRequestConfig,
  ): Promise<ApiResponse> => {
    const response = await axios.delete(url, { data, ...config })
    return response.data
  },
}