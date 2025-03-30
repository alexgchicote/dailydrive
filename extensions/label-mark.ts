// components/LabelMark.ts
import { Mark, mergeAttributes } from '@tiptap/core';

export const LabelMark = Mark.create({
  name: 'label',
  
  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      category: {
        default: null,
      },
      letter: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-label]',
        getAttrs: (dom) => {
          const element = dom as HTMLElement;
          return {
            category: element.getAttribute('data-label'),
            letter: element.getAttribute('data-letter'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    // Define matching colors for background and border
    let bgColor = '';
    let borderColor = '';
    let activeBgColor = '';
    
    if (HTMLAttributes.category === 'Habit') {
      bgColor = 'rgba(0, 122, 255, 0.15)';
      borderColor = 'rgba(0, 122, 255, 0.6)';
      activeBgColor = 'rgba(0, 122, 255, 0.3)';
    } else if (HTMLAttributes.category === 'Goal') {
      bgColor = 'rgba(255, 59, 48, 0.15)';
      borderColor = 'rgba(255, 59, 48, 0.6)';
      activeBgColor = 'rgba(255, 59, 48, 0.3)';
    } else if (HTMLAttributes.category === 'Milestone') {
      bgColor = 'rgba(175, 82, 222, 0.15)';
      borderColor = 'rgba(175, 82, 222, 0.6)';
      activeBgColor = 'rgba(175, 82, 222, 0.3)';
    }
    
    return [
      'span',
      mergeAttributes(HTMLAttributes, {
        'data-label': HTMLAttributes.category,
        'data-letter': HTMLAttributes.letter,
        'data-active-bg': activeBgColor,
        class: 'label-highlight',
        style: `
          display: inline;
          white-space: normal;
          background-color: ${bgColor};
          border-bottom: 2px solid ${borderColor};
          border-radius: 3px 3px 0 0;
          padding: 0 1px 1px 1px;
          transition: background-color 0.15s ease;
          box-decoration-break: clone;
          -webkit-box-decoration-break: clone;
        `
      }),
      0,
    ];
  },
});