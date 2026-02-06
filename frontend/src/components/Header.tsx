
import type { HealthResponse } from '../types';

interface HeaderProps {
  health?: HealthResponse;
}

export function Header({ health }: HeaderProps) {
  return (
    <header className="bg-gray-800 border-b border-gray-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-bold text-gray-100">
            OpenClaw Observability
          </h1>
          <span className="text-sm text-gray-500">
            Dashboard de Sessões
          </span>
        </div>

        {health && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <span
                className={`w-2 h-2 rounded-full ${
                  health.redisConnected
                    ? 'bg-green-500'
                    : 'bg-red-500'
                }`}
              />
              <span className="text-sm text-gray-400">
                Redis:{' '}
                {health.redisConnected ? 'Conectado' : 'Desconectado'}
              </span>
            </div>
            <div className="text-sm text-gray-500">
              {health.discoveryLatency}ms
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
