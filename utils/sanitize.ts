// utils/sanitize.ts
import DOMPurify from 'dompurify'

interface ExtendedDOMPurifyConfig extends DOMPurify.Config {
  ALLOWED_CLASSES?: {
    [key: string]: string[]
  }
}

export const sanitizeHtml = (html: string): string => {
  const config: ExtendedDOMPurifyConfig = {
    ADD_ATTR: ['data-label-type'],
    ALLOWED_ATTR: ['class', 'data-label-type'],
    ALLOWED_CLASSES: {
      'span': ['label-habit', 'label-goal', 'label-milestone', 'label-reflection']
    }
  }
  
  return DOMPurify.sanitize(html, config as DOMPurify.Config)
}