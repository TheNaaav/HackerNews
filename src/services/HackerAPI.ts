import axios from 'axios';
import type { HNSearchResponse, SortMode } from './HackerAPI.types'; 

const BASE_URL = import.meta.env.VITE_API_BASE_URL;

export const searchNews = async (
    query: string, 
    page: number, 
    sort: SortMode): Promise<HNSearchResponse> => {

    const endpoint = sort === "time" ? "/search_by_date" : "/search";

    const response = await axios.get<HNSearchResponse>(BASE_URL + endpoint, {
        params: {
            query,
            page,
            hitsPerPage: 10,
        },
    });

    return response.data;
}