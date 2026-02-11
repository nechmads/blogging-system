import type { Outlet } from '@hotmetal/content-core'
import type { DataLayerApi } from '@hotmetal/data-layer'

export interface AuditLogEntry {
  postId: string
  outlet: Outlet
  action: string
  status: 'success' | 'failed'
  resultData?: Record<string, unknown>
  errorMessage?: string
}

export async function writeAuditLog(dal: DataLayerApi, entry: AuditLogEntry): Promise<void> {
  await dal.writeAuditLog({
    postId: entry.postId,
    outlet: entry.outlet,
    action: entry.action,
    status: entry.status,
    resultData: entry.resultData ? JSON.stringify(entry.resultData) : undefined,
    errorMessage: entry.errorMessage,
  })
}
