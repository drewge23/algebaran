import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PiPill } from '@/components/PiPill';
import { SHOP_ITEMS } from '@/content/shop';
import { randomInt } from '@/lib/random';
import { usePlayerStore } from '@/store/playerStore';
import type { ShopItem } from '@/types/content';
import { buzz } from '@/lib/haptics';

type Category = 'featured' | 'boosters' | 'customization';

/**
 * The shop: a game economy, not a storefront.
 *
 * Everything costs π that was earned in the app — there is no real-money tier,
 * deliberately (see the soft-currency note in CLAUDE.md; the audience is
 * schoolchildren). It is styled to sit *below* learning in the hierarchy: plain
 * rows, no promotion, nothing that pulls harder than a lesson does.
 */
const CATEGORY_OF: Record<ShopItem['kind'], Category> = {
  avatar: 'customization',
  collectable: 'customization',
  consumable: 'boosters',
  key: 'boosters',
};

export function Collect() {
  const { t } = useTranslation();

  const pi = usePlayerStore((s) => s.pi);
  const ownedItemIds = usePlayerStore((s) => s.ownedItemIds);
  const equippedAvatarId = usePlayerStore((s) => s.equippedAvatarId);
  const unlockedKeyIds = usePlayerStore((s) => s.unlockedKeyIds);
  const purchaseItem = usePlayerStore((s) => s.purchaseItem);
  const addPi = usePlayerStore((s) => s.addPi);
  const equipAvatar = usePlayerStore((s) => s.equipAvatar);
  const unlockKey = usePlayerStore((s) => s.unlockKey);

  const [tab, setTab] = useState<Category>('featured');
  const [flash, setFlash] = useState<string | null>(null);

  const isOwned = (item: ShopItem) =>
    ownedItemIds.includes(item.id) ||
    (item.kind === 'key' && !!item.keyId && unlockedKeyIds.includes(item.keyId));

  const buy = (item: ShopItem) => {
    if (!purchaseItem(item.id)) return;
    buzz(12);
    if (item.kind === 'consumable') {
      // Fortune cookie: a random π reward.
      const reward = randomInt(10, 200);
      addPi(reward);
      setFlash(`${item.glyph}  +${reward} π`);
    } else if (item.kind === 'key' && item.keyId) {
      unlockKey(item.keyId);
      setFlash(`${item.glyph}  ${t('shop.unlocked')}`);
    }
  };

  // Featured is what you could actually buy next, cheapest first — a useful
  // shortlist rather than a marketing slot.
  const items =
    tab === 'featured'
      ? SHOP_ITEMS.filter((i) => !isOwned(i))
          .slice()
          .sort((a, b) => a.cost - b.cost)
          .slice(0, 4)
      : SHOP_ITEMS.filter((i) => CATEGORY_OF[i.kind] === tab);

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <h1 className="screen__title grow" style={{ fontSize: 26 }}>
          {t('shop.title')}
        </h1>
        <PiPill compact />
      </div>

      <div className="tabs">
        {(['featured', 'boosters', 'customization'] as const).map((id) => (
          <button
            type="button"
            key={id}
            className={`tab${tab === id ? ' tab--on' : ''}`}
            onClick={() => setTab(id)}>
            {t(`shop.tabs.${id}`)}
          </button>
        ))}
      </div>

      {flash && <div className="shop-flash pop">{flash}</div>}

      <div className="shop-grid">
        {items.map((item) => {
          const owned = isOwned(item);
          const equipped = equippedAvatarId === item.id;
          const affordable = pi >= item.cost;

          return (
            <div className="shop-item" key={item.id}>
              <span className="shop-item__glyph" aria-hidden="true">
                {item.glyph}
              </span>
              <span className="shop-item__text">
                <span className="shop-item__name">{item.name}</span>
                <span className="shop-item__desc">{item.description}</span>
                {item.multiplier > 0 && (
                  <span className="shop-item__bonus">
                    {t('shop.incomeBonus', { value: item.multiplier })}
                  </span>
                )}
              </span>

              {owned && item.kind === 'avatar' ? (
                <button
                  type="button"
                  className="shop-action"
                  disabled={equipped}
                  onClick={() => equipAvatar(item.id)}>
                  {equipped ? t('shop.equipped') : t('shop.equip')}
                </button>
              ) : owned && item.kind !== 'consumable' ? (
                <span className="shop-owned">✓ {t('shop.owned')}</span>
              ) : (
                <button
                  type="button"
                  className="shop-action shop-action--buy"
                  disabled={!affordable}
                  onClick={() => buy(item)}>
                  <span className="shop-price">{item.cost} π</span>
                </button>
              )}
            </div>
          );
        })}
      </div>

      {items.length === 0 && <p className="screen__sub">{t('shop.empty')}</p>}
    </div>
  );
}
