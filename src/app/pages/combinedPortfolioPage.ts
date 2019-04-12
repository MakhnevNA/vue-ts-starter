import {Container, Inject} from "typescript-ioc";
import {ContentLoader} from "vue-content-loader";
import {Route} from "vue-router";
import {namespace} from "vuex-class/lib/bindings";
import {CompositePortfolioManagement} from "../components/dialogs/compositePortfolioManagement";
import {Resolver} from "../../../typings/vue";
import {Component, UI} from "../app/ui";
import {CombinedPortfoliosTable} from "../components/combinedPortfoliosTable";
import {BlockByTariffDialog} from "../components/dialogs/blockByTariffDialog";
import {ShowProgress} from "../platform/decorators/showProgress";
import {ClientInfo, ClientService} from "../services/clientService";
import {OverviewService} from "../services/overviewService";
import {HighStockEventsGroup} from "../types/charts/types";
import {CombinedData} from "../types/eventObjects";
import {Permission} from "../types/permission";
import {StoreKeys} from "../types/storeKeys";
import {ForbiddenCode, Overview} from "../types/types";
import {UiStateHelper} from "../utils/uiStateHelper";
import {StoreType} from "../vuex/storeType";
import {BasePortfolioPage} from "./basePortfolioPage";

const MainStore = namespace(StoreType.MAIN);

@Component({
    // language=Vue
    template: `
        <div>
            <v-slide-x-reverse-transition>
                <template v-if="overview">
                    <base-portfolio-page :overview="overview" :line-chart-data="lineChartData" :line-chart-events="lineChartEvents"
                                         :view-currency="viewCurrency" :state-key-prefix="StoreKeys.PORTFOLIO_COMBINED_CHART" :side-bar-opened="sideBarOpened"
                                         @reloadLineChart="loadPortfolioLineChart">
                                         <template #afterDashboard>
                                            <v-layout>
                                                <div>
                                                    Управление составным портфелем
                                                </div>
                                                <v-spacer></v-spacer>
                                                <div>
                                                <v-btn class="btn" color="#3B6EC9" @click.stop="showDialog">
                                                    Сформировать
                                                </v-btn>
                                                </div>
                                            </v-layout>
                                        </template>
                        <!--<template #afterDashboard>
                            <expanded-panel :value="$uistate.combinedPanel" :state="$uistate.COMBINED_CONTROL_PANEL">
                                <template #header></template>

                                <v-card-text>
                                    <combined-portfolios-table :portfolios="clientInfo.user.portfolios" @change="onSetCombined"></combined-portfolios-table>
                                </v-card-text>

                                <v-container slot="underCard" grid-list-md text-xs-center>
                                    <v-layout row wrap>
                                        <v-flex xs6>
                                            <v-btn color="info" @click.stop="doCombinedPortfolio">Сформировать</v-btn>
                                        </v-flex>
                                        <v-flex xs6>
                                            <v-select :items="['RUB', 'USD', 'EUR']" v-model="viewCurrency" label="Валюта представления" @change="doCombinedPortfolio"
                                                      single-line></v-select>
                                        </v-flex>
                                    </v-layout>
                                </v-container>
                            </expanded-panel>
                        </template>-->
                    </base-portfolio-page>
                </template>
                <template v-else>
                    <content-loader :height="800" :width="800" :speed="1" primaryColor="#f3f3f3" secondaryColor="#ecebeb">
                        <rect x="0" y="20" rx="5" ry="5" width="801.11" height="80"/>
                        <rect x="0" y="120" rx="5" ry="5" width="801.11" height="30"/>
                        <rect x="0" y="170" rx="5" ry="5" width="801.11" height="180"/>
                        <rect x="0" y="370" rx="5" ry="5" width="801.11" height="180"/>
                        <rect x="0" y="570" rx="5" ry="5" width="801.11" height="180"/>
                    </content-loader>
                </template>
            </v-slide-x-reverse-transition>
        </div>
    `,
    components: {BasePortfolioPage, CombinedPortfoliosTable, ContentLoader}
})
export class CombinedPortfolioPage extends UI {

    @MainStore.Getter
    private clientInfo: ClientInfo;
    @MainStore.Getter
    private sideBarOpened: boolean;
    @Inject
    private overviewService: OverviewService;
    /** Данные комбинированного портфеля */
    private overview: Overview = null;
    /** Валюта просмотра портфеля */
    private viewCurrency = "RUB";
    /** Данные графика стоимости портфеля */
    private lineChartData: any[] = null;
    /** Данные по событиям для графика стоимости */
    private lineChartEvents: HighStockEventsGroup[] = null;
    /** Ключи для сохранения информации */
    private StoreKeys = StoreKeys;

    /**
     * Инициализация данных компонента
     * @inheritDoc
     */
    async created(): Promise<void> {
        await this.doCombinedPortfolio();
    }

    /**
     * Осуществляет проверку доступа к разделу
     * @param {Route} to      целевой объект Route, к которому осуществляется переход.
     * @param {Route} from    текущий путь, с которого осуществляется переход к новому.
     * @param {Resolver} next функция, вызов которой разрешает хук.
     * @inheritDoc
     * @returns {Promise<void>}
     */
    async beforeRouteEnter(to: Route, from: Route, next: Resolver): Promise<void> {
        const clientService: ClientService = Container.get(ClientService);
        const clientInfo = await clientService.getClientInfo();
        if (!clientInfo.tariff.hasPermission(Permission.COMBINED_PORTFOLIO)) {
            await new BlockByTariffDialog().show(ForbiddenCode.PERMISSION_DENIED);
            next(false);
            return;
        }
        next();
    }

    private async showDialog(): Promise<void> {
        await new CompositePortfolioManagement().show();
    }

    private async doCombinedPortfolio(): Promise<void> {
        this.overview = null;
        const ids = this.clientInfo.user.portfolios.filter(value => value.combined).map(value => value.id);
        this.overview = await this.overviewService.getPortfolioOverviewCombined({ids: ids, viewCurrency: this.viewCurrency});
        await this.loadPortfolioLineChart();
    }

    @ShowProgress
    private async onSetCombined(data: CombinedData): Promise<void> {
        await this.overviewService.setCombinedFlag(data.id, data.combined);
    }

    private async onPortfolioLineChartPanelStateChanges(): Promise<void> {
        await this.loadPortfolioLineChart();
    }

    private async loadPortfolioLineChart(): Promise<void> {
        const ids = this.clientInfo.user.portfolios.filter(value => value.combined).map(value => value.id);
        if (UiStateHelper.historyPanel[0] === 1) {
            this.lineChartData = await this.overviewService.getCostChartCombined({ids: ids, viewCurrency: this.viewCurrency});
            this.lineChartEvents = await this.overviewService.getEventsChartDataCombined({ids: ids, viewCurrency: this.viewCurrency});
        }
    }
}
