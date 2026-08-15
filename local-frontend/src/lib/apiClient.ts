let jwtToken: string | null = null;

/**
 * Stores the JWT token in memory only.
 */
export const setToken = (token: string | null) => {
  jwtToken = token;
};

export const getToken = () => {
  return jwtToken;
};

/**
 * A fetch wrapper that automatically appends the Authorization header
 * if a token is present in memory.
 */
export const apiClient = async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
  // If memory token is empty (e.g. after reload), try sessionStorage
  if (!jwtToken && typeof window !== "undefined") {
    jwtToken = sessionStorage.getItem("feni_token");
  }

  const headers = new Headers(init?.headers);
  
  if (jwtToken) {
    headers.set("Authorization", `Bearer ${jwtToken}`);
  }

  const response = await fetch(input, {
    ...init,
    headers,
  });

  return response;
};
