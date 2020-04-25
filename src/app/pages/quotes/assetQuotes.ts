/*
 * STRICTLY CONFIDENTIAL
 * TRADE SECRET
 * PROPRIETARY:
 *       "Intelinvest" Ltd, TIN 1655386205
 *       420107, REPUBLIC OF TATARSTAN, KAZAN CITY, SPARTAKOVSKAYA STREET, HOUSE 2, ROOM 119
 * (c) "Intelinvest" Ltd, 2019
 *
 * СТРОГО КОНФИДЕНЦИАЛЬНО
 * КОММЕРЧЕСКАЯ ТАЙНА
 * СОБСТВЕННИК:
 *       ООО "Интеллектуальные инвестиции", ИНН 1655386205
 *       420107, РЕСПУБЛИКА ТАТАРСТАН, ГОРОД КАЗАНЬ, УЛИЦА СПАРТАКОВСКАЯ, ДОМ 2, ПОМЕЩЕНИЕ 119
 * (c) ООО "Интеллектуальные инвестиции", 2019
 */

import {Inject} from "typescript-ioc";
import {namespace} from "vuex-class/lib/bindings";
import {Component, UI} from "../../app/ui";
import {CommonAssetQuotesFilter} from "../../components/commonAssetQuotesFilter";
import {AddTradeDialog} from "../../components/dialogs/addTradeDialog";
import {AssetEditDialog} from "../../components/dialogs/assetEditDialog";
import {ConfirmDialog} from "../../components/dialogs/confirmDialog";
import {EmptySearchResult} from "../../components/emptySearchResult";
import {ShowProgress} from "../../platform/decorators/showProgress";
import {BtnReturn} from "../../platform/dialogs/customDialog";
import {AssetCategory, AssetModel, AssetService} from "../../services/assetService";
import {ClientInfo} from "../../services/clientService";
import {FiltersService} from "../../services/filtersService";
import {AssetQuotesFilter} from "../../services/marketService";
import {AssetType} from "../../types/assetType";
import {EventType} from "../../types/eventType";
import {Operation} from "../../types/operation";
import {StoreKeys} from "../../types/storeKeys";
import {Tariff} from "../../types/tariff";
import {Portfolio, TableHeader} from "../../types/types";
import {CommonUtils} from "../../utils/commonUtils";
import {TradeUtils} from "../../utils/tradeUtils";
import {MutationType} from "../../vuex/mutationType";
import {StoreType} from "../../vuex/storeType";

const MainStore = namespace(StoreType.MAIN);

@Component({
    // language=Vue
    template: `
        <v-container v-if="portfolio" fluid class="pa-0" data-v-step="0">
            <v-layout align-center justify-start row fill-height>
                <common-asset-quotes-filter :filter="filter" @input="tableSearch" @filter="onFilterChange" :min-length="1" placeholder="Поиск"
                                            :store-key="StoreKeys.CUSTOM_QUOTES_FILTER_KEY"></common-asset-quotes-filter>

                <v-btn v-if="userAssetsAllowed" color="primary" class="mr-4" @click="openAddAssetDialog">
                    Добавить
                </v-btn>
            </v-layout>

            <v-container v-if="assets.length === 0" class="h100pc">
                <v-layout justify-center align-center column class="h100pc">
                    <v-img src="./img/portfolio/empty-portfolio.svg" width="100%" heigth="100%" max-width="353" max-height="302" class="margB35"></v-img>
                    <div class="alignC mw520">
                        <div v-if="userAssetsAllowed" class="fs16">
                            Список кастомных активов пуст
                        </div>
                        <div v-else class="fs16">
                            Этот раздел служит для создания любых произвольных активов.<br/>
                            Например, для учета недвижимости, депозитов, долей в компаниях и прочих активов.<br/>
                            Для управления произвольными активами у вас должен быть
                            <router-link to="/settings/tariffs">подключен</router-link>
                            тарифный план Стандарт или Профессионал.
                        </div>
                    </div>
                </v-layout>
            </v-container>

            <template v-else>
                <empty-search-result v-if="filteredAssets.length === 0 && assets.length !== 0" @resetFilter="resetFilter"></empty-search-result>

                <v-data-table v-else :headers="headers" :items="filteredAssets" item-key="id" class="data-table quotes-table table-bottom-pagination" must-sort expand hide-actions>
                    <template #items="props">
                        <tr class="selectable" @dblclick="props.expanded = !props.expanded">
                            <td>
                        <span @click="props.expanded = !props.expanded"
                              :class="{'data-table-cell-open': props.expanded, 'path': true, 'data-table-cell': true}"></span>
                            </td>
                            <td class="text-xs-left">
                                <asset-link :ticker="String(props.item.id)">{{ props.item.ticker }}</asset-link>
                            </td>
                            <td class="text-xs-left">{{ props.item.name }}</td>
                            <td class="text-xs-left">{{ props.item.category.description }}</td>
                            <td class="text-xs-center ii-number-cell">
                                {{ props.item.price | amount(true, null, true, false) }} <span class="second-value">{{ currencyForPrice(props.item) }}</span>
                            </td>
                            <td class="text-xs-left">{{ props.item.source }}</td>
                            <td class="text-xs-left">{{ props.item.regex }}</td>
                            <td class="text-xs-center">{{ props.item.currency }}</td>
                            <td class="text-xs-left">{{ props.item.tags }}</td>
                            <td class="justify-end layout px-0" @click.stop>
                                <v-menu transition="slide-y-transition" bottom left nudge-bottom="25">
                                    <v-btn slot="activator" flat icon dark>
                                        <span class="menuDots"></span>
                                    </v-btn>
                                    <v-list dense>
                                        <v-list-tile @click="openAssetEditDialog(props.item)">
                                            <v-list-tile-title>
                                                Редактировать
                                            </v-list-tile-title>
                                        </v-list-tile>
                                        <v-list-tile @click="deleteAsset(props.item.id)">
                                            <v-list-tile-title class="delete-btn">
                                                Удалить
                                            </v-list-tile-title>
                                        </v-list-tile>
                                        <v-divider></v-divider>
                                        <v-list-tile @click="openTradeDialog(props.item, operation.BUY)">
                                            <v-list-tile-title>
                                                Купить
                                            </v-list-tile-title>
                                        </v-list-tile>
                                        <v-list-tile @click="openTradeDialog(props.item, operation.SELL)">
                                            <v-list-tile-title>
                                                Продать
                                            </v-list-tile-title>
                                        </v-list-tile>
                                        <v-list-tile @click="openTradeDialog(props.item, operation.DIVIDEND)">
                                            <v-list-tile-title>
                                                Дивиденд
                                            </v-list-tile-title>
                                        </v-list-tile>
                                    </v-list>
                                </v-menu>
                            </td>
                        </tr>
                    </template>

                    <template #expand="props">
                        <v-card flat class="mt-2">
                            <span class="bold">Заметка:</span>
                            <v-card-text>{{ props.item.note }}</v-card-text>
                        </v-card>
                    </template>
                </v-data-table>
            </template>
        </v-container>
    `,
    components: {CommonAssetQuotesFilter, EmptySearchResult}
})
export class AssetQuotes extends UI {

    @MainStore.Action(MutationType.RELOAD_PORTFOLIO)
    private reloadPortfolio: (id: number) => Promise<void>;
    @MainStore.Getter
    private portfolio: Portfolio;
    @MainStore.Getter
    private clientInfo: ClientInfo;
    /** Текущая операция */
    private operation = Operation;
    @Inject
    private assetService: AssetService;
    @Inject
    private filtersService: FiltersService;

    /** Фильтр котировок */
    private filter: AssetQuotesFilter = this.filtersService.getAssetFilter(StoreKeys.CUSTOM_QUOTES_FILTER_KEY, {
        searchQuery: "",
        categories: [...AssetCategory.values()],
        currency: null,
    });

    private assets: AssetModel[] = [];

    private filteredAssets: AssetModel[] = [];
    /** Ключи для сохранения информации */
    private StoreKeys = StoreKeys;

    private headers: TableHeader[] = [
        {text: "", align: "left", sortable: false, value: "", width: "50"},
        {text: "Тикер", align: "left", value: "ticker", width: "80"},
        {text: "Компания", align: "left", value: "name", width: "200"},
        {text: "Тип", align: "left", value: "category", width: "50"},
        {text: "Цена", align: "center", value: "price", width: "50"},
        {text: "Источник", align: "center", value: "source", width: "300"},
        {text: "Регулярное выражение", align: "center", value: "regex", sortable: false, width: "100"},
        {text: "Валюта", align: "center", value: "currency", width: "50"},
        {text: "Тэги", align: "center", value: "tags", sortable: false, width: "50"},
        {text: "", value: "", align: "center", sortable: false, width: "50"}
    ];

    async created(): Promise<void> {
        await this.loadAssets();
        UI.on(EventType.ASSET_CREATED, async () => await this.loadAssets());
        UI.on(EventType.ASSET_UPDATED, async () => await this.loadAssets());
        UI.on(EventType.TRADE_CREATED, async () => await this.reloadPortfolio(this.portfolio.id));
    }

    beforeDestroy(): void {
        UI.off(EventType.ASSET_CREATED);
        UI.off(EventType.ASSET_UPDATED);
        UI.off(EventType.TRADE_CREATED);
    }

    private async resetFilter(): Promise<void> {
        this.filter.searchQuery = "";
        this.filter.categories = [...AssetCategory.values()];
        this.filter.currency = null;
        this.filteredAssets = [...this.assets];
    }

    @ShowProgress
    private async loadAssets(): Promise<void> {
        this.assets = await this.assetService.getUserAssets();
        this.filteredAssets = [...this.assets];
        this.onFilterChange();
    }

    private async tableSearch(search: string): Promise<void> {
        this.filter.searchQuery = search;
        const searchString = search.toLowerCase();
        this.filteredAssets = this.assets.filter(asset => {
            return asset.name.toLowerCase().includes(searchString) ||
                asset.ticker.toLowerCase().includes(searchString);
        });
    }

    private onFilterChange(): void {
        this.filteredAssets = this.assets.filter(asset => this.filter.categories.includes(asset.category) &&
            (!CommonUtils.exists(this.filter.currency) || asset.currency === this.filter.currency));
    }

    private async openTradeDialog(asset: AssetModel, operation: Operation): Promise<void> {
        await new AddTradeDialog().show({
            store: this.$store.state[StoreType.MAIN],
            router: this.$router,
            shareId: String(asset.id),
            operation,
            assetType: AssetType.ASSET
        });
    }

    /**
     * Открывает диалог на редактирование актива
     * @param asset редактируемый актив
     */
    private async openAssetEditDialog(asset: AssetModel): Promise<void> {
        const result = await new AssetEditDialog().show({asset, router: this.$router});
        if (result) {
            const isInCurrentPortfolio = this.portfolio.overview.assetPortfolio.rows.some(row => row.share.id === asset.id);
            if (isInCurrentPortfolio && result.needUpdate) {
                await this.reloadPortfolio(this.portfolio.id);
            }
        }
    }

    private async openAddAssetDialog(): Promise<void> {
        await new AssetEditDialog().show({asset: null, router: this.$router});
    }

    private async deleteAsset(assetId: number): Promise<void> {
        const result = await new ConfirmDialog().show("Вы уверены, что хотите удалить актив? (Если по активу есть сделки, его нельзя удалить)");
        if (result === BtnReturn.YES) {
            await this.deleteAssetAndReloadData(assetId);
        }
    }

    @ShowProgress
    private async deleteAssetAndReloadData(assetId: number): Promise<void> {
        await this.assetService.deleteAsset(assetId);
        await this.loadAssets();
    }

    private currencyForPrice(asset: AssetModel): string {
        return TradeUtils.currencySymbolByAmount(asset.price).toLowerCase();
    }

    /**
     * Возвращает признак доступности раздела с пользовательскими активами.
     * Если у пользователя тариф не Бесплатный
     */
    private get userAssetsAllowed(): boolean {
        return this.clientInfo.user.tariff !== Tariff.FREE;
    }
}
