import { PiniaPluginContext } from 'pinia';

export interface PersistStrategy {
	key?: string;
	storage?: Storage;
	paths?: string[];
}

export interface PersistOptions {
	enabled: true;
	strategies?: PersistStrategy[];
}

type Store = PiniaPluginContext['store'];
type PartialState = Partial<Store['$state']>;

declare module 'pinia' {
	export interface DefineStoreOptionsBase<S, Store> {
		persist?: PersistOptions;
	}
}

const defaultStorage = localStorage;

export const updateStorage = (strategy: PersistStrategy, store: Store) => {
	const storage = strategy.storage || defaultStorage;
	const storeKey = strategy.key || store.$id;

	if (strategy.paths) {
		const partialState = strategy.paths.reduce((finalObj, key) => {
			finalObj[key] = store.$state[key];
			return finalObj;
		}, {} as PartialState);

		storage.setItem(storeKey, JSON.stringify(partialState));
	} else {
		storage.setItem(storeKey, JSON.stringify(store.$state));
	}
};

export default ({ options, store }: PiniaPluginContext): void => {
	if (options.persist?.enabled) {
		const defaultStrat: PersistStrategy[] = [
			{
				key: store.$id,
				storage: defaultStorage,
			},
		];

		const strategies: PersistStrategy[] = options.persist?.strategies?.length
			? options.persist?.strategies
			: defaultStrat;

		strategies.forEach(strategy => {
			const storage = strategy.storage || defaultStorage;
			const storeKey = strategy.key || store.$id;
			const storageResult = storage.getItem(storeKey);

			if (storageResult) {
				store.$patch(JSON.parse(storageResult));
			} else {
				updateStorage(strategy, store);
			}
		});

		store.$subscribe(() => {
			strategies.forEach(strategy => {
				updateStorage(strategy, store);
			});
		});
	}
};
