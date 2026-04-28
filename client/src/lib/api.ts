import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_BASE } from './config';

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });
  if (!res.ok) throw new Error(`API ${res.status}: ${res.statusText}`);
  return res.json() as Promise<T>;
}

// Auth
export function useMe() {
  return useQuery({ queryKey: ['me'], queryFn: () => apiFetch('/auth/me'), retry: false });
}

export function useSignIn() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: { address: string; message: string; signature: string }) =>
      apiFetch('/auth/signin', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch('/auth/logout', { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['me'] }),
  });
}

// Bounties
export function useBounties(params?: { status?: string; template?: string; limit?: string }) {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery({ queryKey: ['bounties', params], queryFn: () => apiFetch(`/bounties?${search}`) });
}

export function useBounty(id: string) {
  return useQuery({ queryKey: ['bounty', id], queryFn: () => apiFetch(`/bounties/${id}`), enabled: !!id });
}

export function useBountyState(id: string) {
  return useQuery({ queryKey: ['bountyState', id], queryFn: () => apiFetch(`/bounties/${id}/state`), enabled: !!id });
}

export function useCreateDraft() {
  return useMutation({
    mutationFn: (body: { brief: string; templateHint?: string }) =>
      apiFetch('/bounties/draft', { method: 'POST', body: JSON.stringify(body) }),
  });
}

export function useConfirmBounty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/bounties', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['bounties'] }),
  });
}

export function useCancelBounty() {
  return useMutation({
    mutationFn: ({ id, posterAddress }: { id: string; posterAddress: string }) =>
      apiFetch(`/bounties/${id}/cancel`, { method: 'POST', body: JSON.stringify({ posterAddress }) }),
  });
}

// Templates
export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: () => apiFetch('/bounties/templates/list') });
}

// Agents
export function useAgents(params?: { sort?: string; limit?: string }) {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery({ queryKey: ['agents', params], queryFn: () => apiFetch(`/agents?${search}`) });
}

export function useAgent(address: string) {
  return useQuery({ queryKey: ['agent', address], queryFn: () => apiFetch(`/agents/${address}`), enabled: !!address });
}

// Posters
export function usePoster(address: string) {
  return useQuery({ queryKey: ['poster', address], queryFn: () => apiFetch(`/posters/${address}`), enabled: !!address });
}

// Operators
export function useMyAgents(operatorAddress: string) {
  return useQuery({
    queryKey: ['myAgents', operatorAddress],
    queryFn: () => apiFetch(`/operators/me/agents`),
    enabled: !!operatorAddress,
  });
}

export function useDeployAgent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: Record<string, unknown>) =>
      apiFetch('/operators/agents', { method: 'POST', body: JSON.stringify(body) }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['myAgents'] }),
  });
}

export function useWithdrawEarnings() {
  return useMutation({
    mutationFn: ({ address, operatorAddress, amount }: { address: string; operatorAddress: string; amount: string }) =>
      apiFetch(`/operators/agents/${address}/withdraw`, { method: 'POST', body: JSON.stringify({ operatorAddress, amount }) }),
  });
}

// Deliveries
export function useDelivery(bountyId: string) {
  return useQuery({
    queryKey: ['delivery', bountyId],
    queryFn: () => apiFetch(`/deliveries/${bountyId}`),
    enabled: !!bountyId,
  });
}

// Settlement
export function useApproveBounty() {
  return useMutation({
    mutationFn: ({ bountyId, ...body }: { bountyId: string; posterAddress: string; rating?: number; comment?: string }) =>
      apiFetch(`/bounties/${bountyId}/approve`, { method: 'POST', body: JSON.stringify(body) }),
  });
}

export function useRejectBounty() {
  return useMutation({
    mutationFn: ({ bountyId, ...body }: { bountyId: string; posterAddress: string; reason: string }) =>
      apiFetch(`/bounties/${bountyId}/reject`, { method: 'POST', body: JSON.stringify(body) }),
  });
}

// Feed
export function useFeed(params?: { limit?: string; since?: string }) {
  const search = new URLSearchParams(params as Record<string, string>).toString();
  return useQuery({ queryKey: ['feed', params], queryFn: () => apiFetch(`/feed?${search}`), refetchInterval: 10_000 });
}

// Notifications
export function useNotifications(userAddress: string, unread = false) {
  return useQuery({
    queryKey: ['notifications', userAddress, unread],
    queryFn: () => apiFetch(`/notifications?userAddress=${userAddress}&unread=${unread}`),
    enabled: !!userAddress,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => apiFetch(`/notifications/${id}/read`, { method: 'POST' }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  });
}

// Resources
export function useResourceCatalog() {
  return useQuery({ queryKey: ['resourceCatalog'], queryFn: () => apiFetch('/resources/catalog') });
}

export function useResourceStats() {
  return useQuery({
    queryKey: ['resourceStats'],
    queryFn: () => apiFetch<{
      period: string;
      totalCalls: number;
      totalUsdt: number;
      endpoints: Record<string, { calls: number; usdt: number }>;
    }>('/resources/stats'),
    refetchInterval: 30_000,
  });
}

// Operator profile
export function useOperatorProfile(address: string) {
  return useQuery({
    queryKey: ['operatorProfile', address],
    queryFn: () => apiFetch(`/operators/${address}`),
    enabled: !!address,
  });
}
