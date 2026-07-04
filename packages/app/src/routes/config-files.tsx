import { createFileRoute } from '@tanstack/react-router'

import { EmptyCard } from '@/components/empty-card'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TabsContent } from '@/components/ui/tabs'
import { useConfig } from '@/contexts/config'

export const Route = createFileRoute('/config-files')({
  component: RouteComponent,
})

function RouteComponent() {
  const { config } = useConfig()

  if (config.configFiles.length === 0) {
    return (
      <EmptyCard
        title='Config files'
        message='No config files were reported. This should not happen for a valid inspect result; regenerate the inspect data.'
      />
    )
  }

  return (
    <TabsContent value='config-files'>
      <Card>
        <CardHeader>
          <CardTitle>Visited config files</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-2'>
            {config.configFiles.map((file, index) => (
              <div key={file} className='flex items-start gap-3 border-b pb-2 last:border-0 last:pb-0'>
                <Badge variant='outline'>{index}</Badge>
                <code className='py-0.5 break-all'>{file}</code>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </TabsContent>
  )
}
