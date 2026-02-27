export default ({
  toaster: {
    position: 'bottom-right' as const,
    expand: true,
    duration: 5000,
  },
  ui: {
    header: {
      slots: {
        center: 'flex-1 flex justify-start',
      },
    },
    icons: {
      caution: 'i-carbon-warning-alt',
      copy: 'i-carbon-copy',
      dark: 'i-carbon-moon',
      document: 'i-carbon-document',
      external: 'i-carbon-launch',
      hash: 'i-carbon-hashtag',
      light: 'i-carbon-sun',
      menu: 'i-carbon-menu',
      next: 'i-carbon-arrow-right',
      note: 'i-carbon-information',
      prev: 'i-carbon-arrow-left',
      system: 'i-carbon-computer',
      tip: 'i-carbon-idea',
      warning: 'i-carbon-warning',
      chevronDoubleLeft: 'i-carbon-chevron-double-left',
      chevronDoubleRight: 'i-carbon-chevron-double-right',
      chevronDown: 'i-carbon-chevron-down',
      chevronLeft: 'i-carbon-chevron-left',
      chevronRight: 'i-carbon-chevron-right',
      arrowLeft: 'i-carbon-arrow-left',
      arrowRight: 'i-carbon-arrow-right',
      check: 'i-carbon-checkmark',
      close: 'i-carbon-close',
      ellipsis: 'i-carbon-overflow-menu-horizontal',
      loading: 'i-carbon-in-progress',
      minus: 'i-carbon-subtract',
      search: 'i-carbon-search',
    },
    navigationMenu: {
      slots: {
        item: '!py-0',
        link: 'flex flex-col items-center justify-start w-full gap-0.5 w-[90px]',
        linkLabel: 'text-xs text-toned',
        linkTrailing: 'absolute right-2 top-2',
        linkTrailingIcon: 'size-4 text-dimmed',
        childList: '!grid-cols-5',
        childLink: 'flex flex-col items-center justify-start w-full gap-0.5',
        childLinkLabel: 'text-[10px] text-center text-muted',
        childLinkIcon: 'size-6 !text-blue-300',
      },
      variants: {
        active: {
          false: {
            linkLeadingIcon: 'text-toned',
          },
        },
      },
    },
    colors: {
      primary: 'violet',
      neutral: 'mauve',
      pro: 'violet',
    },
    separator: {
      slots: {
        border: 'border-gray-200 dark:border-gray-800',
      },
    },
    contentNavigation: {
      slots: {
        list: 'space-y-2',
        listWithChildren: 'border-none transform mb-5',
      },
      variants: {
        active: {
          true: {
            link: 'text-[var(--ui-text-toned)] after:-left-[1px] font-semibold rounded-[10px] after:rounded-[10px] after:w-full after:h-full after:absolute after:bottom-0 after:block after:bg-elevated/50 after:shadow-xs',
          },
          false: {
            link: 'text-[var(--ui-text-toned)]',
            linkLeadingIcon: 'text-dimmed',
          },
        },
      },
      compoundVariants: [
        {
          color: 'primary',
          variant: 'pill',
          active: true,
          class: {
            link: 'text-highlighted',
          },
        },
      ],
    },
    prose: {
      codeIcon: {
        'robots.txt': 'vscode-icons:file-type-robots',
        'txt': 'vscode-icons:file-type-text',
      },
      a: {
        base: [
          'relative border-none underline underline-offset-4 text-[var(--ui-text)] decoration-transition-all decoration-opacity-70 decoration-[0.1rem] decoration-[var(--ui-text-dimmed)]',
          'transition-all',
          'hover:text-dimmed decoration-opacity-100 hover:underline-offset-1 hover:decoration-[0.1rem]',
        ],
      },
    },
  },
})
