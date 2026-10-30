import {
  Archive,
  Armchair,
  Laptop,
  Package,
  Presentation,
  Projector,
  Sofa,
  Speaker,
  Tv,
} from 'lucide-react'

export const ROOM_ASSETS = [
  { key: 'room-2', seats: 2, label: 'Phone booth', hint: 'Up to 2 people' },
  { key: 'room-4', seats: 4, label: 'Huddle room', hint: 'Up to 4 people' },
  { key: 'room-6', seats: 6, label: 'Team room', hint: 'Up to 6 people' },
  { key: 'room-8', seats: 8, label: 'Workshop room', hint: 'Up to 8 people' },
  { key: 'room-10', seats: 10, label: 'Boardroom', hint: 'Up to 10 people' },
]

export const RESOURCE_ASSETS = [
  {
    key: 'projector',
    label: 'Projector',
    icon: Projector,
    keywords: ['projector', 'beamer'],
  },
  {
    key: 'whiteboard',
    label: 'Whiteboard',
    icon: Presentation,
    keywords: ['whiteboard', 'white board', 'flip chart'],
  },
  {
    key: 'smart-board',
    label: 'Smart board',
    icon: Tv,
    keywords: ['smart board', 'smartboard', 'interactive', 'display'],
  },
  {
    key: 'speakerphone',
    label: 'Speakerphone',
    icon: Speaker,
    keywords: ['speaker', 'conference phone', 'audio'],
  },
  {
    key: 'desk',
    label: 'Desk',
    icon: Laptop,
    keywords: ['desk', 'table', 'workstation'],
  },
  {
    key: 'chair',
    label: 'Ergonomic chair',
    icon: Armchair,
    keywords: ['chair', 'seat'],
  },
  {
    key: 'cabinet',
    label: 'Filing cabinet',
    icon: Archive,
    keywords: ['cabinet', 'locker', 'storage', 'drawer'],
  },
  {
    key: 'lounge',
    label: 'Lounge space',
    icon: Sofa,
    keywords: ['lounge', 'sofa', 'couch', 'collaborat'],
  },
  { key: 'other', label: 'Other', icon: Package, keywords: [] },
]

export const roomAssetForCapacity = (capacity) => {
  const seats = Number(capacity) || 6

  if (seats <= 2) {
    return 'room-2'
  }

  if (seats <= 4) {
    return 'room-4'
  }

  if (seats <= 6) {
    return 'room-6'
  }

  if (seats <= 8) {
    return 'room-8'
  }

  return 'room-10'
}

const guessResourceAsset = (resource) => {
  const text =
    `${resource.name ?? ''} ${resource.facilities ?? ''}`.toLowerCase()
  const nameText = (resource.name ?? '').toLowerCase()
  const match =
    RESOURCE_ASSETS.find((asset) =>
      asset.keywords.some((word) => nameText.includes(word)),
    ) ||
    RESOURCE_ASSETS.find((asset) =>
      asset.keywords.some((word) => text.includes(word)),
    )
  return match?.key ?? 'other'
}

export const resolveAssetKey = (resource) => {
  if (resource.type === 'room') {
    return ROOM_ASSETS.some((asset) => asset.key === resource.assetKey)
      ? resource.assetKey
      : roomAssetForCapacity(resource.capacity)
  }

  return RESOURCE_ASSETS.some((asset) => asset.key === resource.assetKey)
    ? resource.assetKey
    : guessResourceAsset(resource)
}

export const resourceAssetMeta = (assetKey) =>
  RESOURCE_ASSETS.find((asset) => asset.key === assetKey) ??
  RESOURCE_ASSETS[RESOURCE_ASSETS.length - 1]

export const resourceIconFor = (item) =>
  resourceAssetMeta(item.assetKey ?? guessResourceAsset(item)).icon
