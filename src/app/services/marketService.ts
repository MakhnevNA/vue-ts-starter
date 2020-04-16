import {Inject, Singleton} from "typescript-ioc";
import {Service} from "../platform/decorators/service";
import {Http, UrlParams} from "../platform/services/http";
import {BaseChartDot, Dot, EventChartData, HighStockEventData, HighStockEventsGroup} from "../types/charts/types";
import {CurrencyItem} from "../types/currency";
import {Asset, AssetInfo, Bond, BondInfo, BondType, PageableResponse, Pagination, Share, ShareDynamic, Stock, StockInfo} from "../types/types";
import {ChartUtils} from "../utils/chartUtils";
import {CommonUtils} from "../utils/commonUtils";
import {AssetCategory} from "./assetService";

@Service("MarketService")
@Singleton
export class MarketService {

    @Inject
    private http: Http;

    async putRate(rate: string, ticker: string): Promise<Share[]> {
        return this.http.post(`/market/rating/${ticker}/${rate}`);
    }

    async searchStocks(query: string): Promise<Share[]> {
        return this.http.get("/market/stocks/search", {query});
    }

    async searchBonds(query: string): Promise<Share[]> {
        return this.http.get("/market/bonds/search", {query});
    }

    async searchAssets(query: string): Promise<Share[]> {
        return this.http.get("/market/assets/search", {query});
    }

    async searchShares(query: string): Promise<Share[]> {
        return this.http.get("/market/shares/search", {query});
    }

    async getStockInfo(ticker: string): Promise<StockInfo> {
        const result = await this.http.get<_stockInfo>(`/market/stock/${ticker}/info`);
        return {
            share: result.share,
            history: this.convertDots(result.history),
            dividends: result.dividends,
            shareDynamic: result.shareDynamic,
            events: this.convertStockEvents(result.dividends, ticker)
        } as StockInfo;
    }

    async getAssetInfo(assetId: string): Promise<AssetInfo> {
        const result = await this.http.get<_assetInfo>(`/market/asset/${assetId}/info`);
        return {
            share: result.share,
            dividends: result.dividends,
            shareDynamic: result.shareDynamic,
            history: this.convertDots(result.history),
            events: {}
        } as AssetInfo;
    }

    async getBondInfo(secid: string): Promise<BondInfo> {
        const result = await this.http.get<_bondInfo>(`/market/bond/${secid}/info`);
        return {
            bond: result.bond,
            history: this.convertDots(result.history),
            payments: ChartUtils.convertBondPayments(result.payments),
            events: ChartUtils.processEventsChartData(result.payments, "flags", "dataseries", "circlepin", 10)
        };
    }

    /**
     * Загружает и возвращает список акций
     */
    async loadStocks(pagination: Pagination, filter: QuotesFilter): Promise<PageableResponse<Stock>> {
        const urlParams = this.makeFilterRequest(pagination, filter);
        return this.http.get<PageableResponse<Stock>>(`/market/stocks`, urlParams);
    }

    /**
     * Загружает и возвращает список облигаций
     */
    async loadBonds(pagination: Pagination, filter: QuotesFilter): Promise<PageableResponse<Bond>> {
        const urlParams = this.makeFilterRequest(pagination, filter);
        return this.http.get<PageableResponse<Bond>>(`/market/bonds`, urlParams);
    }

    /**
     * Загружает и возвращает список валюты
     */
    async loadCurrencies(): Promise<CurrencyItem[]> {
        return this.http.get<CurrencyItem[]>(`/market/currency`);
    }

    /**
     * Загружает и возвращает список акций из индекса ММВБ
     */
    async loadTopStocks(): Promise<Stock[]> {
        return this.http.get<Stock[]>(`/market/top-stocks`);
    }

    private makeFilterRequest(pagination: Pagination, filter: QuotesFilter): UrlParams {
        const offset: number = pagination.rowsPerPage * (pagination.page - 1) || 0;
        const pageSize: number = pagination.rowsPerPage || 50;
        const sortColumn: string = pagination.sortBy || "ticker";
        const descending: boolean = pagination.descending;
        const search: string = filter.searchQuery || "";
        const currency: string = filter.currency;
        const showUserShares = filter.showUserShares;
        const urlParams: UrlParams = {offset, pageSize, search, showUserShares};
        if (sortColumn) {
            urlParams.sortColumn = sortColumn.toUpperCase();
        }
        if (filter.bondType) {
            urlParams.bondType = filter.bondType.code;
        }
        if (CommonUtils.exists(descending)) {
            urlParams.descending = descending;
        }
        if (CommonUtils.exists(currency)) {
            urlParams.currency = currency;
        }
        return urlParams;
    }

    private convertDots(dots: _baseChartDot[]): Dot[] {
        const result: Dot[] = [];
        dots.forEach(value => {
            result.push([new Date(value.date).getTime(), value.price]);
        });
        return result || [];
    }

    private convertStockEvents(events: BaseChartDot[], ticker: string): HighStockEventsGroup {
        const data: HighStockEventData[] = [];
        events.forEach(dot => {
            data.push({text: `Дивиденд на сумму ${dot.amount}`, title: "D", x: new Date(dot.date).getTime()});
        });
        return {
            type: "flags",
            data: data,
            onSeries: "dataseries",
            shape: "circlepin",
            color: "#93D8FF",
            fillColor: "#93D8FF",
            stackDistance: 20,
            width: 10
        };
    }
}

export interface QuotesFilter {
    searchQuery?: string;
    showUserShares?: boolean;
    currency?: string;
    bondType?: BondType;
}

export interface AssetQuotesFilter {
    searchQuery?: string;
    categories?: AssetCategory[];
    currency?: string;
}

/** Информация по акции */
type _stockInfo = {
    /** Акция */
    share: Stock;
    /** История цены */
    history: _baseChartDot[];
    /** Дивиденды */
    dividends: BaseChartDot[];
    /** Динамика */
    shareDynamic: ShareDynamic;
};

/** Информация по акции */
type _assetInfo = {
    /** Актив */
    share: Asset;
    /** История цены */
    history: _baseChartDot[];
    /** Дивиденды */
    dividends: BaseChartDot[];
    /** Информация по динамике ценной бумаги */
    shareDynamic: ShareDynamic;
};

/** Информация по акции */
type _bondInfo = {
    /** Облигация */
    bond: Bond;
    /** История цены */
    history: _baseChartDot[];
    /** Выплаты по бумаге */
    payments: EventChartData[];
};

export type _baseChartDot = {
    date: string,
    price: number
};
