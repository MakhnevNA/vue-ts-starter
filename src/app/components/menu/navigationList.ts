import {namespace} from "vuex-class";
import {Component, Prop, UI} from "../../app/ui";
import {ClientInfo} from "../../services/clientService";
import {Tariff} from "../../types/tariff";
import {NavBarItem} from "../../types/types";
import {StoreType} from "../../vuex/storeType";
import {PortfolioSwitcher} from "../portfolioSwitcher";

const MainStore = namespace(StoreType.MAIN);

@Component({
    // language=Vue
    template: `
        <v-layout class="overflow-hidden">
            <v-layout column justify-space-between align-center class="mini-menu-width">
                <div>
                    <v-btn @click.stop="openDialog" fab dark small color="indigo" depressed class="add-btn-menu">
                        <v-icon dark>add</v-icon>
                    </v-btn>
                </div>
            </v-layout>
            <v-layout v-if="!sideBarOpened" column class="wrap-list-menu">
                <div v-if="showFreeTariffBlock" class="tariff-notification">
                    <div class="margB8">У Вас бесплатный тариф. Подпишитесь и получите полный набор инструментов для учета активов без ограничений</div>
                    <a @click="goToTariffs" class="v-btn theme--light big_btn primary">Подписаться</a>
                </div>
                <div v-for="item in mainSection">
                    <template v-if="item.subMenu">
                        <v-menu transition="slide-y-transition" bottom left class="submenu-item-list" content-class="submenu-v-menu" nudge-bottom="47">
                            <v-list-tile slot="activator" :class="{'active-link': subMenuRouteSelected(item)}">
                                <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                                <v-list-tile-action>
                                    <v-icon color="grey lighten-1">keyboard_arrow_down</v-icon>
                                </v-list-tile-action>
                            </v-list-tile>
                            <v-list-tile active-class="active-link" v-for="subItem in item.subMenu" :key="subItem.action"
                                         :to="{path: subItem.path, name: subItem.action, params: subItem.params}">
                                <v-list-tile-content>
                                    <v-list-tile-title>{{ subItem.title }}</v-list-tile-title>
                                </v-list-tile-content>
                            </v-list-tile>
                        </v-menu>
                    </template>
                    <v-list-tile v-else :key="item.action" active-class="active-link"
                                 :to="{path: item.path, name: item.action, params: item.params}">
                        <v-list-tile-content v-if="item.action === LinkAdditionalFunctionality.EVENTS && numberOfEvents" class="badge-link">
                            <v-badge color="primary">
                                <template #badge>
                                    <span title="У вас есть новые события по портфелю!">{{ numberOfEvents >= 100 ? "99+" : numberOfEvents }}</span>
                                </template>
                                <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                            </v-badge>
                        </v-list-tile-content>
                        <v-list-tile-content v-else>
                            <v-list-tile-title>{{ item.title }}</v-list-tile-title>
                        </v-list-tile-content>
                    </v-list-tile>
                </div>
            </v-layout>
        </v-layout>
    `,
    components: {PortfolioSwitcher}
})
export class NavigationList extends UI {

    @Prop({type: Boolean, required: true})
    private sideBarOpened: boolean;

    @Prop({required: true})
    private mainSection: NavBarItem[];

    @Prop({type: Number})
    private numberOfEvents: number;

    @MainStore.Getter
    private clientInfo: ClientInfo;

    /** Список ссылок с доп. функционалом */
    private LinkAdditionalFunctionality = LinkAdditionalFunctionality;

    private openDialog(): void {
        this.$emit("openDialog");
    }

    private subMenuRouteSelected(item: NavBarItem): boolean {
        const path = this.$route.path;
        const subMenu = item.subMenu.map(menu => menu.action || menu.path);
        return subMenu.some(menu => path.includes(menu));
    }

    private goToTariffs(): void {
        if (this.$router.currentRoute.path !== "/settings/tariffs") {
            this.$router.push("/settings/tariffs");
        }
    }

    private get showFreeTariffBlock(): boolean {
        return this.clientInfo.user.tariff === Tariff.FREE;
    }
}

export enum LinkAdditionalFunctionality {
    EVENTS = "events"
}
