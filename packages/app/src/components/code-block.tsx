import type { HighlighterCore, ThemedToken } from 'shiki/core'
import type { BundledTheme } from 'shiki/themes'
import type { ResolvedTheme } from '@/contexts/theme'

import javascript from '@shikijs/langs/javascript'
import json from '@shikijs/langs/json'
import githubDarkDefault from '@shikijs/themes/github-dark-default'
import githubLightDefault from '@shikijs/themes/github-light-default'
import { useEffect, useState } from 'react'
import { createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'

import { useTheme } from '@/contexts/theme'

type Language = 'javascript' | 'json'

type HighlightedCode = {
  code: string
  lang: Language
  theme: BundledTheme
  tokens: ThemedToken[][]
}

type CodeBlockProps = {
  code: string
  lang: Language
}

const CODE_THEMES: Record<ResolvedTheme, BundledTheme> = {
  dark: 'github-dark-default',
  light: 'github-light-default',
}

let highlighterPromise: Promise<HighlighterCore> | null = null

async function getHighlighter() {
  highlighterPromise ??= createHighlighterCore({
    langs: [javascript, json],
    themes: [githubDarkDefault, githubLightDefault],
    engine: createJavaScriptRegexEngine(),
  })

  return highlighterPromise
}

export function CodeBlock(props: CodeBlockProps) {
  const { code, lang } = props
  const { resolvedTheme } = useTheme()
  const [highlightedCode, setHighlightedCode] = useState<HighlightedCode | null>(null)
  const theme = CODE_THEMES[resolvedTheme]
  const currentHighlightedCode =
    highlightedCode?.code === code && highlightedCode.lang === lang && highlightedCode.theme === theme
      ? highlightedCode
      : null

  useEffect(() => {
    let ignore = false

    async function highlightCode() {
      try {
        const highlighter = await getHighlighter()
        const result = highlighter.codeToTokens(code, { lang, theme, defaultColor: false })

        if (!ignore) {
          setHighlightedCode({ code, lang, theme, tokens: result.tokens })
        }
      } catch {
        if (!ignore) {
          setHighlightedCode(null)
        }
      }
    }

    void highlightCode()

    return () => {
      ignore = true
    }
  }, [code, lang, theme])

  return (
    <pre className='max-h-96 overflow-auto border bg-secondary p-3 text-sm'>
      <code>
        {currentHighlightedCode ? (
          currentHighlightedCode.tokens.map((line, lineIndex) => (
            // oxlint-disable-next-line @eslint-react/no-array-index-key
            <span key={lineIndex} className='block min-h-lh'>
              {line.map((token) => (
                <span key={`${token.offset}-${token.content}`} style={{ color: token.color }}>
                  {token.content}
                </span>
              ))}
            </span>
          ))
        ) : (
          <>{code}</>
        )}
      </code>
    </pre>
  )
}
