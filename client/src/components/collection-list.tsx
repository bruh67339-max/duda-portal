import type { ReactNode } from 'react';
import { useContent } from './content-provider';
import { cn } from '@/lib/utils';
import type { CollectionItem } from '@/lib/portal-content';

interface CollectionListProps<T extends CollectionItem> {
  /** The collection key to look up in the portal collections data */
  collectionKey: string;
  /** Render function for each item */
  renderItem: (item: T, index: number) => ReactNode;
  /** Additional CSS classes for the container */
  className?: string;
  /** Message to display when collection is empty */
  emptyMessage?: string;
  /** Custom component to render when collection is empty */
  emptyComponent?: ReactNode;
  /** Filter function to filter items before rendering */
  filter?: (item: T) => boolean;
  /** Sort function to sort items before rendering */
  sort?: (a: T, b: T) => number;
  /** Limit the number of items rendered */
  limit?: number;
}

/**
 * Renders a collection (like menu items, team members, etc.) from the portal.
 * Provides filtering, sorting, and limit options.
 *
 * @example
 * // Basic usage
 * <CollectionList
 *   collectionKey="menu_items"
 *   renderItem={(item) => <MenuItem key={item.id} {...item} />}
 * />
 *
 * @example
 * // With styling and empty state
 * <CollectionList<MenuItem>
 *   collectionKey="menu_items"
 *   className="grid grid-cols-2 gap-4"
 *   emptyMessage="No menu items available"
 *   renderItem={(item) => (
 *     <div key={item.id} className="p-4 border rounded-lg">
 *       <h3>{item.name}</h3>
 *       <p>{item.price}</p>
 *     </div>
 *   )}
 * />
 *
 * @example
 * // With filtering and sorting
 * <CollectionList<MenuItem>
 *   collectionKey="menu_items"
 *   filter={(item) => item.category === 'Pizza'}
 *   sort={(a, b) => parseFloat(a.price) - parseFloat(b.price)}
 *   limit={6}
 *   renderItem={(item) => <MenuItem key={item.id} {...item} />}
 * />
 */
export function CollectionList<T extends CollectionItem>({
  collectionKey,
  renderItem,
  className,
  emptyMessage = 'No items found',
  emptyComponent,
  filter,
  sort,
  limit,
}: CollectionListProps<T>) {
  const { content } = useContent();

  let items = (content.collections[collectionKey] ?? []) as T[];

  // Apply filter if provided
  if (filter) {
    items = items.filter(filter);
  }

  // Apply sort if provided
  if (sort) {
    items = [...items].sort(sort);
  }

  // Apply limit if provided
  if (limit !== undefined && limit > 0) {
    items = items.slice(0, limit);
  }

  if (items.length === 0) {
    if (emptyComponent) {
      return <>{emptyComponent}</>;
    }
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn(className)}>{items.map((item, index) => renderItem(item, index))}</div>
  );
}

/**
 * Hook to get collection items directly.
 * Use this when you need more control over rendering.
 *
 * @param key - The collection key
 * @returns Array of collection items (empty array if not found)
 *
 * @example
 * function MenuGrid() {
 *   const menuItems = useCollection<MenuItem>('menu_items');
 *
 *   const pizzas = menuItems.filter(item => item.category === 'Pizza');
 *   const pastas = menuItems.filter(item => item.category === 'Pasta');
 *
 *   return (
 *     <>
 *       <section>
 *         <h2>Pizzas</h2>
 *         {pizzas.map(item => <MenuItem key={item.id} {...item} />)}
 *       </section>
 *       <section>
 *         <h2>Pastas</h2>
 *         {pastas.map(item => <MenuItem key={item.id} {...item} />)}
 *       </section>
 *     </>
 *   );
 * }
 */
export function useCollection<T extends CollectionItem>(key: string): T[] {
  const { content } = useContent();
  return (content.collections[key] ?? []) as T[];
}

/**
 * Groups collection items by a specific field.
 *
 * @param key - The collection key
 * @param groupBy - The field to group by
 * @returns Object with group names as keys and arrays of items as values
 *
 * @example
 * function MenuByCategory() {
 *   const grouped = useCollectionGrouped<MenuItem>('menu_items', 'category');
 *
 *   return (
 *     <>
 *       {Object.entries(grouped).map(([category, items]) => (
 *         <section key={category}>
 *           <h2>{category}</h2>
 *           {items.map(item => <MenuItem key={item.id} {...item} />)}
 *         </section>
 *       ))}
 *     </>
 *   );
 * }
 */
export function useCollectionGrouped<T extends CollectionItem>(
  key: string,
  groupBy: keyof T
): Record<string, T[]> {
  const items = useCollection<T>(key);

  return items.reduce(
    (groups, item) => {
      const groupKey = String(item[groupBy] ?? 'Other');
      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(item);
      return groups;
    },
    {} as Record<string, T[]>
  );
}

/**
 * Renders a grouped collection with section headers.
 *
 * @example
 * <GroupedCollectionList<MenuItem>
 *   collectionKey="menu_items"
 *   groupBy="category"
 *   renderItem={(item) => <MenuItem key={item.id} {...item} />}
 *   renderGroupHeader={(groupName, items) => (
 *     <h2 className="text-xl font-bold mt-8 mb-4">{groupName}</h2>
 *   )}
 *   className="grid grid-cols-2 gap-4"
 * />
 */
export function GroupedCollectionList<T extends CollectionItem>({
  collectionKey,
  groupBy,
  renderItem,
  renderGroupHeader,
  className,
  groupClassName,
  emptyMessage = 'No items found',
}: {
  collectionKey: string;
  groupBy: keyof T;
  renderItem: (item: T, index: number) => ReactNode;
  renderGroupHeader?: (groupName: string, items: T[]) => ReactNode;
  className?: string;
  groupClassName?: string;
  emptyMessage?: string;
}) {
  const grouped = useCollectionGrouped<T>(collectionKey, groupBy);
  const groupNames = Object.keys(grouped);

  if (groupNames.length === 0) {
    return <p className="text-muted-foreground">{emptyMessage}</p>;
  }

  return (
    <div className={cn(className)}>
      {groupNames.map((groupName) => (
        <div key={groupName}>
          {renderGroupHeader?.(groupName, grouped[groupName])}
          <div className={cn(groupClassName)}>
            {grouped[groupName].map((item, index) => renderItem(item, index))}
          </div>
        </div>
      ))}
    </div>
  );
}
