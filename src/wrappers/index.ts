import { execWithRoute } from '../proxy/router.js'

export async function runWrapped(
  binName: string,
  binPath: string,
  args: string[],
  extraEnv?: Record<string, string>
): Promise<void> {
  await execWithRoute(binName, binPath, args, extraEnv)
}
