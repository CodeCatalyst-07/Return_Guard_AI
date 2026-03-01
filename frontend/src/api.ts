import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export const api = axios.create({
    baseURL: API_BASE_URL,
});

export interface UserRisk {
    user_id: string;
    score: number;
    level: string;
    explanation: string;
}

export interface DashboardMetrics {
    total_transactions: number;
    return_rate: number;
    average_risk_score: number;
    high_risk_count: number;
}

export const getMetrics = () => api.get<DashboardMetrics>('/api/metrics/summary');
export const getAlerts = () => api.get<UserRisk[]>('/api/fraud/alerts');
export const getUserRisk = (userId: string) => 
    api.get<UserRisk>(`/api/users/${userId}/risk`);

export const generateDemoData = (numUsers: number = 10) => 
    api.post(`/api/demo/generate-data?num_users=${numUsers}`);
