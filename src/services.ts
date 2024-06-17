import { Store } from '@fethcat/store'
import axios, { AxiosRequestConfig, AxiosResponse } from 'axios'

const timeout = 60000

export function request<T = never>(url: string, config: AxiosRequestConfig): Promise<AxiosResponse<T>> {
  const headers = {
    'Content-Type': 'application/json',
    ...config.headers,
  }
  return axios.request<T>({ ...config, headers, baseURL: url, timeout })
}

export const store = new Store()
