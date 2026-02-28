import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000';

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

export const getMetrics = () => api.get<DashboardMetrics>('/metrics/summary');
export const getAlerts = () => api.get<UserRisk[]>('/fraud/alerts');
export const getUserRisk = (userId: string) => api.get<UserRisk>(`/users/${userId}/risk`);
export const generateDemoData = (numUsers: number = 10) => api.post(`/demo/generate-data?num_users=${numUsers}`);
