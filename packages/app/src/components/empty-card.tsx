import { MutedText } from './muted-text'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'

type EmptyCardProps = {
  message: string
  title: string
}

export function EmptyCard(props: EmptyCardProps) {
  const { message, title } = props

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <MutedText>{message}</MutedText>
      </CardContent>
    </Card>
  )
}
