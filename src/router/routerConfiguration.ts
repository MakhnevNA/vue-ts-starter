import {Container} from 'typescript-ioc';
import Vue from 'vue';
import VueRouter from 'vue-router';
import {NavigationGuard, Route, RouteConfig} from 'vue-router/types/router';
import {BondInfoPage} from '../pages/bondInfoPage';
import {CombinedPortfolioPage} from '../pages/combinedPortfolioPage';
import {ImportExportPage} from '../pages/importExportPage';
import {NotificationsPage} from '../pages/notificationsPage';
import {PortfolioPage} from '../pages/portfolioPage';
import {ProfilePage} from '../pages/profilePage';
import {PromoCodesPage} from '../pages/promoCodesPage';
import {SettingsPage} from '../pages/settingsPage';
import {ShareInfoPage} from '../pages/shareInfoPage';
import {TariffsPage} from '../pages/tariffsPage';
import {TradesPage} from '../pages/tradesPage';
import {Storage} from '../platform/services/storage';
import {LogoutService} from '../services/logoutService';

Vue.use(VueRouter);

/** Сервис работы с localStorage */
const localStorage: Storage = Container.get(Storage);

/**
 * Класс отвечающий за создание роутингов и инициализацию роутера
 */
export class RouterConfiguration {

    /** Экземпляр роутера */
    private static router: VueRouter;

    /**
     * Возвращает инициализированный экземпляр роутера
     * @returns {VueRouter} роутер
     */
    static getRouter(): VueRouter {
        if (!RouterConfiguration.router) {
            RouterConfiguration.router = new VueRouter({
                base: '/',
                routes: RouterConfiguration.createRoutes(),
                scrollBehavior: (() => ({x: 0, y: 0}))
            });
        }
        return RouterConfiguration.router;
    }

    private static createRoutes(): RouteConfig[] {
        return [
            {
                path: '/logout',
                name: 'logout',
                beforeEnter: () => (Container.get(LogoutService) as LogoutService).logout()
            },
            {
                path: '*',
                beforeEnter: () => {
                    console.log('BEFORE ENTER');
                },
                redirect: '/portfolio'
            },
            {
                name: 'portfolio',
                path: '/portfolio',
                component: PortfolioPage
            },
            {
                name: 'trades',
                path: '/trades',
                component: TradesPage
            },
            {
                name: 'combined-portfolio',
                path: '/combined-portfolio',
                component: CombinedPortfolioPage
            },
            {
                name: 'share-info',
                path: '/share-info/:ticker',
                component: ShareInfoPage
            },
            {
                name: 'bond-info',
                path: '/bond-info/:isin',
                component: BondInfoPage
            },
            {
                name: 'portfolio-settings',
                path: '/portfolio-settings',
                component: SettingsPage
            },
            {
                name: 'import-export',
                path: '/import-export',
                component: ImportExportPage
            },
            {
                name: 'profile',
                path: '/profile',
                component: ProfilePage
            },
            {
                name: 'tariffs',
                path: '/tariffs',
                component: TariffsPage
            },
            {
                name: 'promo-codes',
                path: '/promo-codes',
                component: PromoCodesPage
            },
            {
                name: 'notifications',
                path: '/notifications',
                component: NotificationsPage
            }
        ];
    }
}
