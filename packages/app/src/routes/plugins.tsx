import { createFileRoute } from '@tanstack/react-router'
import { AlertTriangleIcon } from 'lucide-react'

import { EmptyCard } from '@/components/empty-card'
import { JsonBlock } from '@/components/json-block'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { TabsContent } from '@/components/ui/tabs'
import { useConfig } from '@/contexts/config'

export const Route = createFileRoute('/plugins')({
  component: RouteComponent,
})

function RouteComponent() {
  const { config } = useConfig()

  return (
    <TabsContent value='plugins'>
      <div className='grid gap-4'>
        {config.pluginErrors.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center gap-2'>
                <AlertTriangleIcon className='size-4 text-destructive' />
                Plugin load errors
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-3'>
              {config.pluginErrors.map((error) => (
                <JsonBlock key={`${error.specifier}-${error.message}`} value={error} />
              ))}
            </CardContent>
          </Card>
        ) : null}

        {config.plugins.length > 0 ? (
          <Card>
            <CardHeader>
              <CardTitle>Plugins</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Specifier</TableHead>
                    <TableHead>Rules</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {config.plugins.map((plugin) => (
                    <TableRow key={`${plugin.source}-${plugin.name}`}>
                      <TableCell className='font-mono'>{plugin.name}</TableCell>
                      <TableCell>
                        <Badge variant={plugin.source === 'builtin' ? 'secondary' : 'outline'}>{plugin.source}</Badge>
                      </TableCell>
                      <TableCell className='font-mono'>{plugin.specifier ?? '-'}</TableCell>
                      <TableCell>{plugin.ruleCount}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ) : (
          <EmptyCard title='Plugins' message='No plugins were found.' />
        )}
      </div>
    </TabsContent>
  )
}
