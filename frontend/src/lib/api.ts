/**
 * SimpleNews API Client
 * Typed client for interacting with the Django REST Framework backend.
 */

export interface TokenResponse {
  access: string;
  refresh: string;
}

export interface RefreshResponse {
  access: string;
}

export interface CurrentUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  date_joined: string;
  is_staff: boolean;
  is_superuser: boolean;
}

export interface AdminUser {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_staff: boolean;
  is_superuser: boolean;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
}

export interface ApiCategory {
  id: number;
  name: string;
  slug: string;
  description: string;
  created_at: string;
}

export interface ApiArticle {
  id: number;
  title: string;
  slug: string;
  summary: string;
  content: string;
  category: number;
  category_name: string;
  author: number;
  author_username: string;
  image: string;
  is_featured: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
}

export interface ArticleInput {
  title: string;
  slug?: string;
  summary: string;
  content: string;
  category: number;
  image?: string;
  image_file?: File | null;
  is_featured?: boolean;
  is_published?: boolean;
}

export interface DashboardStats {
  total_articles: number;
  published_articles: number;
  draft_articles: number;
  featured_articles: number;
  total_categories: number;
  total_users: number;
}

export interface ApiBookmark {
  id: number;
  article: {
    id: number;
    title: string;
    slug: string;
    summary: string;
    category_name?: string;
    author_username?: string;
    image: string;
    created_at: string;
  };
  created_at: string;
}

export class ApiError extends Error {
  status: number;
  data: Record<string, unknown> | null;

  constructor(status: number, message: string, data: Record<string, unknown> | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

// Token storage helpers (safe for SSR / static export)
const ACCESS_TOKEN_KEY = 'simplenews_access_token';
const REFRESH_TOKEN_KEY = 'simplenews_refresh_token';

export const tokenStorage = {
  getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(ACCESS_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    try {
      return localStorage.getItem(REFRESH_TOKEN_KEY);
    } catch {
      return null;
    }
  },
  setTokens(access: string, refresh?: string) {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(ACCESS_TOKEN_KEY, access);
      if (refresh) {
        localStorage.setItem(REFRESH_TOKEN_KEY, refresh);
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  },
  clearTokens() {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(ACCESS_TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // Ignore storage errors
    }
  },
};

const getBaseUrl = (): string => {
  return process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';
};

// Queue to handle concurrent refresh requests
let isRefreshing = false;
let refreshSubscribers: ((token: string | null) => void)[] = [];

function onTokenRefreshed(token: string | null) {
  refreshSubscribers.forEach((callback) => callback(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(callback: (token: string | null) => void) {
  refreshSubscribers.push(callback);
}

/**
 * Base fetch wrapper with Bearer token injection and automatic 401 token refresh.
 */
export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {},
  retry = true
): Promise<T> {
  const baseUrl = getBaseUrl();
  const url = `${baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});
  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const token = tokenStorage.getAccessToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  let response: Response;
  try {
    response = await fetch(url, {
      ...options,
      headers,
    });
  } catch (error) {
    throw new ApiError(0, 'Network error. Please check your connection to the server.', null);
  }

  // Handle 401 Unauthorized by attempting to refresh token
  if (response.status === 401 && retry) {
    const refreshToken = tokenStorage.getRefreshToken();
    if (!refreshToken) {
      tokenStorage.clearTokens();
      throw new ApiError(401, 'Session expired. Please log in again.');
    }

    if (!isRefreshing) {
      isRefreshing = true;
      try {
        const refreshResponse = await fetch(`${baseUrl}/api/token/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh: refreshToken }),
        });

        if (refreshResponse.ok) {
          const refreshData: RefreshResponse = await refreshResponse.json();
          tokenStorage.setTokens(refreshData.access);
          onTokenRefreshed(refreshData.access);
          isRefreshing = false;

          // Retry the original request
          headers.set('Authorization', `Bearer ${refreshData.access}`);
          return apiFetch<T>(endpoint, { ...options, headers }, false);
        } else {
          tokenStorage.clearTokens();
          onTokenRefreshed(null);
          isRefreshing = false;
          throw new ApiError(401, 'Session expired. Please log in again.');
        }
      } catch (err) {
        tokenStorage.clearTokens();
        onTokenRefreshed(null);
        isRefreshing = false;
        throw err;
      }
    } else {
      // Wait for ongoing refresh to complete
      return new Promise<T>((resolve, reject) => {
        addRefreshSubscriber((newToken) => {
          if (newToken) {
            headers.set('Authorization', `Bearer ${newToken}`);
            resolve(apiFetch<T>(endpoint, { ...options, headers }, false));
          } else {
            reject(new ApiError(401, 'Session expired. Please log in again.'));
          }
        });
      });
    }
  }

  if (response.status === 204) {
    return null as unknown as T;
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    data = null;
  }

  if (!response.ok) {
    let errorMessage = `Request failed with status ${response.status}`;
    if (data && typeof data === 'object') {
      const record = data as Record<string, unknown>;
      if (typeof record.detail === 'string') {
        errorMessage = record.detail;
      } else {
        // Collect first validation error message if formatted as DRF field error
        const firstKey = Object.keys(record)[0];
        if (firstKey && Array.isArray(record[firstKey]) && record[firstKey].length > 0) {
          errorMessage = `${firstKey}: ${record[firstKey][0]}`;
        }
      }
    }
    throw new ApiError(response.status, errorMessage, data as Record<string, unknown>);
  }

  return data as T;
}

// ─────────────────────────────────────────────────────────────
// SPECIFIC API MODULES
// ─────────────────────────────────────────────────────────────

export const authApi = {
  async login(username: string, password: string): Promise<TokenResponse> {
    return apiFetch<TokenResponse>('/api/token/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }, false);
  },

  async getMe(): Promise<CurrentUser> {
    return apiFetch<CurrentUser>('/api/accounts/me/');
  },
};

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    return apiFetch<DashboardStats>('/api/dashboard/stats/');
  },
};

export const newsApi = {
  async getArticles(params?: { status?: string; category?: string; search?: string }): Promise<ApiArticle[]> {
    const searchParams = new URLSearchParams();
    if (params?.status) searchParams.set('status', params.status);
    if (params?.category) searchParams.set('category', params.category);
    if (params?.search) searchParams.set('search', params.search);
    const qs = searchParams.toString();
    return apiFetch<ApiArticle[]>(`/api/news/${qs ? `?${qs}` : ''}`);
  },

  async getArticleBySlug(slug: string): Promise<ApiArticle> {
    return apiFetch<ApiArticle>(`/api/news/${encodeURIComponent(slug)}/`);
  },

  async getManageArticle(slug: string): Promise<ApiArticle> {
    return apiFetch<ApiArticle>(`/api/news/${encodeURIComponent(slug)}/manage/`);
  },

  async createArticle(data: ArticleInput): Promise<ApiArticle> {
    if (data.image_file instanceof File) {
      const formData = new FormData();
      formData.append('title', data.title);
      if (data.slug) formData.append('slug', data.slug);
      formData.append('summary', data.summary);
      formData.append('content', data.content);
      formData.append('category', String(data.category));
      formData.append('image_file', data.image_file);
      if (data.image) formData.append('image', data.image);
      if (data.is_featured !== undefined) formData.append('is_featured', String(data.is_featured));
      if (data.is_published !== undefined) formData.append('is_published', String(data.is_published));
      return apiFetch<ApiArticle>('/api/news/create/', {
        method: 'POST',
        body: formData,
      });
    }

    const { image_file, ...jsonData } = data;
    return apiFetch<ApiArticle>('/api/news/create/', {
      method: 'POST',
      body: JSON.stringify(jsonData),
    });
  },

  async updateArticle(slug: string, data: Partial<ArticleInput>): Promise<ApiArticle> {
    if (data.image_file instanceof File) {
      const formData = new FormData();
      if (data.title !== undefined) formData.append('title', data.title);
      if (data.slug !== undefined) formData.append('slug', data.slug);
      if (data.summary !== undefined) formData.append('summary', data.summary);
      if (data.content !== undefined) formData.append('content', data.content);
      if (data.category !== undefined) formData.append('category', String(data.category));
      formData.append('image_file', data.image_file);
      if (data.image !== undefined) formData.append('image', data.image);
      if (data.is_featured !== undefined) formData.append('is_featured', String(data.is_featured));
      if (data.is_published !== undefined) formData.append('is_published', String(data.is_published));
      return apiFetch<ApiArticle>(`/api/news/${encodeURIComponent(slug)}/manage/`, {
        method: 'PATCH',
        body: formData,
      });
    }

    const { image_file, ...jsonData } = data;
    return apiFetch<ApiArticle>(`/api/news/${encodeURIComponent(slug)}/manage/`, {
      method: 'PATCH',
      body: JSON.stringify(jsonData),
    });
  },

  async deleteArticle(slug: string): Promise<void> {
    return apiFetch<void>(`/api/news/${encodeURIComponent(slug)}/manage/`, {
      method: 'DELETE',
    });
  },
};

export const categoriesApi = {
  async getCategories(): Promise<ApiCategory[]> {
    return apiFetch<ApiCategory[]>('/api/categories/');
  },

  async getCategoryBySlug(slug: string): Promise<ApiCategory> {
    return apiFetch<ApiCategory>(`/api/categories/${encodeURIComponent(slug)}/`);
  },

  async createCategory(data: { name: string; slug?: string; description?: string }): Promise<ApiCategory> {
    return apiFetch<ApiCategory>('/api/categories/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async updateCategory(slug: string, data: { name?: string; slug?: string; description?: string }): Promise<ApiCategory> {
    return apiFetch<ApiCategory>(`/api/categories/${encodeURIComponent(slug)}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteCategory(slug: string): Promise<void> {
    return apiFetch<void>(`/api/categories/${encodeURIComponent(slug)}/`, {
      method: 'DELETE',
    });
  },
};

export const usersApi = {
  async getUsers(): Promise<AdminUser[]> {
    return apiFetch<AdminUser[]>('/api/accounts/users/');
  },
};

export const bookmarksApi = {
  async getBookmarks(): Promise<ApiBookmark[]> {
    return apiFetch<ApiBookmark[]>('/api/bookmarks/');
  },

  async createBookmark(articleId: number): Promise<ApiBookmark> {
    return apiFetch<ApiBookmark>('/api/bookmarks/', {
      method: 'POST',
      body: JSON.stringify({ article_id: articleId }),
    });
  },

  async deleteBookmark(bookmarkId: number): Promise<void> {
    return apiFetch<void>(`/api/bookmarks/${bookmarkId}/`, {
      method: 'DELETE',
    });
  },

  async deleteBookmarkByArticleId(articleId: number): Promise<void> {
    return apiFetch<void>(`/api/bookmarks/article/${articleId}/`, {
      method: 'DELETE',
    });
  },
};

