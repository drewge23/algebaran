import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ScrollView, StyleSheet, View } from 'react-native';

import { PrimaryButton } from '@/components/primary-button';
import { Screen } from '@/components/screen';
import { ThemedText } from '@/components/themed-text';
import { SHOP_ITEMS } from '@/content/shop';
import type { ShopItem } from '@/types/content';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { randomInt } from '@/lib/random';
import { usePlayerStore } from '@/store/playerStore';

export default function ShopScreen() {
  const { t } = useTranslation();
  const theme = useTheme();

  const stardust = usePlayerStore((s) => s.stardust);
  const ownedItemIds = usePlayerStore((s) => s.ownedItemIds);
  const equippedAvatarId = usePlayerStore((s) => s.equippedAvatarId);
  const purchaseItem = usePlayerStore((s) => s.purchaseItem);
  const addStardust = usePlayerStore((s) => s.addStardust);
  const equipAvatar = usePlayerStore((s) => s.equipAvatar);
  const unlockKey = usePlayerStore((s) => s.unlockKey);

  const [flash, setFlash] = useState<string | null>(null);

  const buy = (item: ShopItem) => {
    const ok = purchaseItem(item.id);
    if (!ok) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    if (item.kind === 'consumable') {
      // Fortune cookie: a random Stardust reward.
      const reward = randomInt(10, 200);
      addStardust(reward);
      setFlash(`${item.glyph}  +${reward} ✨`);
    } else if (item.kind === 'key' && item.keyId) {
      unlockKey(item.keyId);
      setFlash(`${item.glyph}  unlocked!`);
    }
  };

  return (
    <Screen edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <ThemedText type="subtitle">{t('shop.title')}</ThemedText>
        <ThemedText themeColor="textSecondary">{t('shop.balance', { stardust })}</ThemedText>

        {flash && (
          <View style={[styles.flash, { backgroundColor: theme.backgroundSelected }]}>
            <ThemedText type="smallBold">{flash}</ThemedText>
          </View>
        )}

        {SHOP_ITEMS.map((item) => {
          const owned = ownedItemIds.includes(item.id);
          const equipped = equippedAvatarId === item.id;
          const affordable = stardust >= item.cost;

          return (
            <View
              key={item.id}
              style={[
                styles.card,
                { backgroundColor: theme.backgroundElement, borderColor: theme.border },
              ]}>
              <ThemedText style={styles.glyph}>{item.glyph}</ThemedText>
              <View style={styles.flex}>
                <ThemedText type="smallBold">{item.name}</ThemedText>
                <ThemedText type="small" themeColor="textSecondary">
                  {item.description}
                </ThemedText>
                <ThemedText type="small" themeColor="accent">
                  {item.cost} ✨{item.multiplier > 0 ? `  ·  +${item.multiplier}× income` : ''}
                </ThemedText>
              </View>

              <View style={styles.action}>
                {owned && item.kind === 'avatar' ? (
                  <PrimaryButton
                    label={equipped ? t('shop.equipped') : t('shop.equip')}
                    variant={equipped ? 'secondary' : 'primary'}
                    disabled={equipped}
                    onPress={() => equipAvatar(item.id)}
                  />
                ) : owned && item.kind !== 'consumable' ? (
                  <PrimaryButton label={t('shop.owned')} variant="secondary" disabled />
                ) : (
                  <PrimaryButton
                    label={t('shop.buy')}
                    disabled={!affordable}
                    onPress={() => buy(item)}
                  />
                )}
              </View>
            </View>
          );
        })}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: { padding: Spacing.four, gap: Spacing.three, paddingBottom: Spacing.six },
  flash: {
    alignSelf: 'flex-start',
    paddingVertical: Spacing.one,
    paddingHorizontal: Spacing.three,
    borderRadius: Spacing.five,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    padding: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 1,
  },
  glyph: { fontSize: 32 },
  flex: { flex: 1 },
  action: { minWidth: 96 },
});
