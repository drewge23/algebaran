import { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { PiPill } from '@/components/PiPill';
import { SHOP_ITEMS } from '@/content/shop';
import { randomInt } from '@/lib/random';
import { usePlayerStore } from '@/store/playerStore';
import type { ShopItem } from '@/types/content';

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

  const [flash, setFlash] = useState<string | null>(null);

  const buy = (item: ShopItem) => {
    if (!purchaseItem(item.id)) return;
    navigator.vibrate?.(12);
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

  return (
    <div className="screen screen--scroll">
      <div className="topbar">
        <div className="grow">
          <h1 className="screen__title" style={{ fontSize: 26 }}>
            {t('shop.title')}
          </h1>
        </div>
        <PiPill />
      </div>
      <p className="screen__sub">{t('shop.subtitle')}</p>

      {flash && (
        <div className="pi-pill pop" style={{ alignSelf: 'flex-start', marginTop: 12 }}>
          <span className="pi-pill__value">{flash}</span>
        </div>
      )}

      <div className="stack stack--3" style={{ marginTop: 16 }}>
        {SHOP_ITEMS.map((item) => {
          const isKeyOwned =
            item.kind === 'key' && !!item.keyId && unlockedKeyIds.includes(item.keyId);
          const owned = ownedItemIds.includes(item.id) || isKeyOwned;
          const equipped = equippedAvatarId === item.id;
          const affordable = pi >= item.cost;

          return (
            <div className="tile" key={item.id}>
              <div className="tile__glyph">{item.glyph}</div>
              <div className="tile__grow">
                <div className="tile__name">{item.name}</div>
                <div className="tile__desc">{item.description}</div>
                <div className="tile__meta">
                  {item.cost} π
                  {item.multiplier > 0 && ` · ${t('shop.incomeBonus', { value: item.multiplier })}`}
                </div>
              </div>
              <div className="tile__action">
                {owned && item.kind === 'avatar' ? (
                  <button
                    type="button"
                    className={`chip-btn${equipped ? ' chip-btn--muted' : ''}`}
                    disabled={equipped}
                    onClick={() => equipAvatar(item.id)}>
                    {equipped ? t('shop.equipped') : t('shop.equip')}
                  </button>
                ) : owned && item.kind !== 'consumable' ? (
                  <button type="button" className="chip-btn chip-btn--good" disabled>
                    ✓ {t('shop.owned')}
                  </button>
                ) : (
                  <button
                    type="button"
                    className="chip-btn"
                    disabled={!affordable}
                    onClick={() => buy(item)}>
                    {t('shop.buy')}
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
