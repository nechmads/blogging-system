import { observable } from '@legendapp/state'
import { syncObservable } from '@legendapp/state/sync'
import { ObservablePersistLocalStorage } from '@legendapp/state/persist-plugins/local-storage'

export const checklistStore$ = observable({
  collapsed: false,
  dismissed: false,
})

syncObservable(checklistStore$, {
  persist: {
    name: 'hotmetal-checklist',
    plugin: ObservablePersistLocalStorage,
  },
})
