<script lang="ts">
import type { AvatarProps, LinkProps } from '#ui/types'
import type { DynamicSlots } from '#ui/types/utils'
import type { AppConfig } from '@nuxt/schema'
import _appConfig from '#build/app.config'
import theme from '#build/ui/breadcrumb'
import { tv } from 'tailwind-variants'

const _config = _appConfig as AppConfig & { ui: { breadcrumb: Partial<typeof theme> } }
const breadcrumb = tv({ extend: tv(theme), ...(_config.ui?.breadcrumb || {}) })

export interface BreadcrumbItem extends Omit<LinkProps, 'raw' | 'custom'> {
  label?: string
  icon?: string
  avatar?: AvatarProps
  slot?: string
}

export interface BreadcrumbProps<T> {
  /**
   * The element or component this component should render as.
   * @defaultValue 'div'
   */
  as?: any
  items?: T[]
  /**
   * The icon to use as a separator.
   * @defaultValue appConfig.ui.icons.chevronRight
   */
  separatorIcon?: string
  class?: any
  ui?: any
}

type SlotProps<T> = (props: { item: T, index: number, active?: boolean }) => any

export type BreadcrumbSlots<T extends { slot?: string }> = {
  'item': SlotProps<T>
  'item-leading': SlotProps<T>
  'item-label': SlotProps<T>
  'item-trailing': SlotProps<T>
  'separator': (props?: Record<string, never>) => any
} & DynamicSlots<T, any>
</script>

<script setup lang="ts" generic="T extends BreadcrumbItem">
import { useAppConfig } from '#imports'
import UAvatar from '#ui/components/Avatar.vue'
import UIcon from '#ui/components/Icon.vue'
import ULink from '#ui/components/Link.vue'
import ULinkBase from '#ui/components/LinkBase.vue'
import { pickLinkProps } from '#ui/utils/link'
import { Primitive } from 'reka-ui'

const props = defineProps<BreadcrumbProps<T>>()
const slots = defineSlots<BreadcrumbSlots<T>>()

const appConfig = useAppConfig()

const ui = breadcrumb()
</script>

<template>
  <Primitive :as="as" aria-label="breadcrumb" :class="ui.root({ class: [props.class, props.ui?.root] })">
    <ol :class="ui.list({ class: props.ui?.list })">
      <template v-for="(item, index) in items" :key="index">
        <li :class="ui.item({ class: props.ui?.item })">
          <ULink v-slot="{ active, ...slotProps }" v-bind="pickLinkProps(item)" custom>
            <ULinkBase v-bind="slotProps" as="span" :aria-current="active && (index === (items?.length || 0) - 1) ? 'page' : undefined" :class="ui.link({ class: [props.ui?.link, item.class], active: index === (items?.length || 0) - 1, disabled: !!item.disabled, to: !!item.to })">
              <!-- @vue-ignore -->
              <slot :name="((item as any).slot || 'item') as any" :item="item" :index="index">
                <!-- @vue-ignore -->
                <slot :name="((item as any).slot ? `${(item as any).slot}-leading` : 'item-leading') as any" :item="item" :active="index === (items?.length || 0) - 1" :index="index">
                  <UAvatar v-if="item.avatar" :size="((props.ui?.linkLeadingAvatarSize || ui.linkLeadingAvatarSize()) as any)" v-bind="item.avatar" :class="ui.linkLeadingAvatar({ class: props.ui?.linkLeadingAvatar, active: index === (items?.length || 0) - 1 })" />
                  <UIcon v-else-if="item.icon" :name="item.icon" :class="ui.linkLeadingIcon({ class: props.ui?.linkLeadingIcon, active: index === (items?.length || 0) - 1 })" />
                </slot>

                <span v-if="item.label || !!(slots as any)[(item as any).slot ? `${(item as any).slot}-label` : 'item-label']" :class="ui.linkLabel({ class: props.ui?.linkLabel })">
                  <!-- @vue-ignore -->
                  <slot :name="((item as any).slot ? `${(item as any).slot}-label` : 'item-label') as any" :item="item" :active="index === (items?.length || 0) - 1" :index="index">
                    {{ item.label }}
                  </slot>
                </span>

                <!-- @vue-ignore -->
                <slot :name="((item as any).slot ? `${(item as any).slot}-trailing` : 'item-trailing') as any" :item="item" :active="index === (items?.length || 0) - 1" :index="index" />
              </slot>
            </ULinkBase>
          </ULink>
        </li>

        <li v-if="index < (items?.length || 0) - 1" role="presentation" :class="ui.separator({ class: props.ui?.separator })">
          <slot name="separator">
            <UIcon :name="separatorIcon || appConfig.ui.icons.chevronRight" :class="ui.separatorIcon({ class: props.ui?.separatorIcon })" />
          </slot>
        </li>
      </template>
    </ol>
  </Primitive>
</template>
