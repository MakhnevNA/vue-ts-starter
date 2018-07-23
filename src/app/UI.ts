import {ErrorBag, Validator} from 'vee-validate';
import Vue from 'vue';
import Component from 'vue-class-component';
import {Emit, Model, Prop, Watch} from 'vue-property-decorator';
import {Route} from 'vue-router/types/router';
import {Action, Getter, Mutation, namespace, State} from 'vuex-class';
import {Resolver} from '../../typings/vue';
import {UiStateHelper} from '../utils/uiStateHelper';

Component.registerHooks([
    'beforeRouteEnter',
    'beforeRouteLeave',
    'beforeRouteUpdate'
]);

export {Component, Emit, Model, Prop, Watch};
export {Action, Getter, Mutation, namespace, State};

// @ts-ignore: TS2559: Type 'UI' has no properties in common with type 'IComponentLifecycle'.
export class UI extends Vue implements IComponentLifecycle, IComponentRoutingLifecycle {

    /** Глобальная шина событий */
    private static eventBus = new Vue();
    /** Валидатор */
    $validator: Validator;
    /** Ошибки валидации */
    protected $errors: ErrorBag;
    /** Состояние ui-элементов */
    protected $uistate = UiStateHelper;

    /**
     * Подписывает компонент на глобальное событие
     * @param event    название события
     * @param callback обработчик события
     */
    static on(event: string | string[], callback: (...args: any[]) => any) {
        UI.eventBus.$on(event, callback);
    }

    /**
     * Отписывает компонент от глобального события
     * @param event    название события
     * @param callback обработчик события
     */
    static off(event?: string | string[], callback?: (...args: any[]) => any) {
        UI.eventBus.$off(event, callback);
    }

    /**
     * Отправляет глобальное событие
     * @param event событие
     * @param args  данные
     */
    static emit(event: string, ...args: any[]) {
        UI.eventBus.$emit(event, ...args);
    }
}

/**
 * Жизненный цикл компонента
 */
export interface IComponentLifecycle {

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) сразу после инициализации экземпляра, до настройки наблюдения за
     * данными, механизмов слежения и событий.
     */
    beforeCreate?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) сразу после создания экземпляра. На этом этапе экземпляр закончил
     * обработку опций и настроил наблюдение за данными, вычисляемые свойства, методы, коллбэки слежения и событий.
     * Однако, фаза монтирования ещё не начата, и свойство <code>$el</code> ещё не доступно.
     */
    created?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) перед началом монтирования, сразу перед первым вызовом функции
     * <code>render</code>.
     */
    beforeMount?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) сразу после того как экземпляр был смонтирован, а взамен <code>el</code> создан
     * <code>vm.$el</code>. Если корневой экземпляр смонтирован на элемент документа, <code>vm.$el</code> тоже будет элементом документа. Обратите внимание,
     * что <code>mounted</code> не гарантирует что все дочерние компоненты будут уже примонтированы. Если вы хотите подождать пока не будут отрендерены все, то
     * можете воспользоваться <code>vm.$nextTick(callback)</code> (или <code>await vm.$nextTick()</code>) внутри <code>mounted</code>.
     */
    mounted?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) при изменении данных перед тем, как DOM будет обновлен. Это хорошее место
     * для получения доступа к существующему DOM перед обновлением, например чтобы удалить добавленные слушатели событий.
     */
    beforeUpdate?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) после того, как виртуальный DOM был обновлён из-за изменения данных. DOM
     * компонента будет уже обновлён к моменту вызова этого хука, поэтому вы можете выполнять операции связанные с DOM здесь. Тем не менее, в большинстве
     * случаев старайтесь избегать изменения состояния в этом хуке. Для реагирования на изменение состояния лучше использовать вычисляемые свойства или
     * отслеживание с помощью декоратора <code>@Watch</code>. Обратите внимание, что <code>updated</code> не гарантирует что все дочерние компоненты будут уже
     * перерендерены. Если вы хотите подождать пока не будут перерендерены все, то можете воспользоваться <code>vm.$nextTick(callback)</code>
     * (или <code>await vm.$nextTick()</code>) внутри <code>updated</code>.
     */
    updated?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) при активации keep-alive компонента.
     */
    activated?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) после деактивации keep-alive компонента.
     */
    deactivated?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) перед уничтожением экземпляра Vue.
     * На этом этапе экземпляр всё ещё полностью функционален.
     */
    beforeDestroy?(): void;

    /**
     * Хук жизненного цикла компонента.
     * Вызывается <b>синхронно</b> (даже если метод объявлен как <i>async</i>) после уничтожения экземпляра Vue.
     * К моменту вызова этого хука, все директивы экземпляра Vue уже отвязаны, все подписчики событий удалены, а все дочерние экземпляры Vue уничтожены.
     */
    destroyed?(): void;
}

/**
 * Жизненный цикл навигации компонента
 */
export interface IComponentRoutingLifecycle {

    /**
     * Навигационный хук.
     * Вызывается до подтверждения пути, соответствующего этому компоненту. <b>Не имеет</b> доступа к контексту экземпляра компонента <code>this</code>,
     * так как к моменту вызова экземпляр ещё не создан. Тем не менее, доступ к экземпляру можно получить, передав коллбэк в <code>next</code>. Эта функция
     * будет вызвана после подтверждения навигации, а экземпляр компонента будет передан в неё в качестве параметра:
     * <pre>
     *     beforeRouteEnter (to, from, next) {
     *         next(vm => {
     *             // экземпляр компонента доступен как vm
     *         })
     *     }
     * </pre>
     * Это единственный хук, который поддерживает передачу коллбэка в <code>next</code>.
     * Убедитесь, что функция <code>next</code> будет вызвана, иначе выполнение хука будет не завершено.
     * @param to целевой объект Route, к которому осуществляется переход.
     * @param from текущий маршрут, с которого осуществляется переход к новому.
     * @param next функция, вызов которой разрешает навигацию. В зависимости от переданных в <code>next</code> аргументов, результатом будет:
     * <ul>
     *     <li><code>next()</code>: переход к следующему хуку в цепочке. Если хуков больше нет, переход считается подтверждённым.</li>
     *     <li><code>next(false)</code>: отмена перехода. Если URL был изменён (вручную пользователем, или кнопкой "назад"), он будет сброшен на соответствующий
     *     маршрут <code>from</code>.</li>
     *     <li><code>next('/')</code> или <code>next({ path: '/' })</code>: перенаправление на другой маршрут. Текущий переход будет отменён, и процесс начнётся
     *     заново для нового маршрута. Вы можете передать любой объект местоположения в <code>next</code>, который позволяет вам указывать опции такие как
     *     <code>replace: true, name: 'home'</code> и любой другой параметр используемый во входном параметре <code>to</code> компонента
     *     <code>router-link</code> или функции <code>router.push</code></li>
     *     <li><code>next(error)</code>: если аргумент, переданный <code>next</code>, является экземпляром <code>Error</code>, навигация будет прервана и
     *     ошибка будет передана в коллбэк, зарегистрированный через <code>router.onError()</code>.</li>
     * </ul>
     */
    beforeRouteEnter?(to: Route, from: Route, next: Resolver): void;

    /**
     * Навигационный хук.
     * Вызывается при изменении маршрута, если для его рендеринга будет повторно использован тот же компонент. Например, для маршрута с динамическим
     * параметром <code>'/foo/:id'</code>, когда мы перемещаемся между <code>'/foo/1'</code> и <code>'/foo/2'</code>, экземпляр того же компонента
     * <code>Foo</code> будет использован повторно, и будет вызван этот хук.
     * Имеет доступ к контексту экземпляра компонента <code>this</code>.
     * Убедитесь, что функция <code>next</code> будет вызвана, иначе выполнение хука будет не завершено.
     * @param to целевой объект Route, к которому осуществляется переход.
     * @param from текущий маршрут, с которого осуществляется переход к новому.
     * @param next функция, вызов которой разрешает навигацию. В зависимости от переданных в <code>next</code> аргументов, результатом будет:
     * <ul>
     *     <li><code>next()</code>: переход к следующему хуку в цепочке. Если хуков больше нет, переход считается подтверждённым.</li>
     *     <li><code>next(false)</code>: отмена перехода. Если URL был изменён (вручную пользователем, или кнопкой "назад"), он будет сброшен на соответствующий
     *     маршрут <code>from</code>.</li>
     *     <li><code>next('/')</code> или <code>next({ path: '/' })</code>: перенаправление на другой маршрут. Текущий переход будет отменён, и процесс начнётся
     *     заново для нового маршрута. Вы можете передать любой объект местоположения в <code>next</code>, который позволяет вам указывать опции такие как
     *     <code>replace: true, name: 'home'</code> и любой другой параметр используемый во входном параметре <code>to</code> компонента
     *     <code>router-link</code> или функции <code>router.push</code></li>
     *     <li><code>next(error)</code>: если аргумент, переданный <code>next</code>, является экземпляром <code>Error</code>, навигация будет прервана и
     *     ошибка будет передана в коллбэк, зарегистрированный через <code>router.onError()</code>.</li>
     * </ul>
     */
    beforeRouteUpdate?(to: Route, from: Route, next: Resolver): void;

    /**
     * Навигационный хук.
     * Вызывается перед переходом от пути, соответствующего текущему компоненту. Имеет доступ к контексту экземпляра компонента <code>this</code>.
     * Обычно используется для предотвращения случайного ухода пользователя со страницы с несохранёнными изменениями.
     * Убедитесь, что функция <code>next</code> будет вызвана, иначе выполнение хука будет не завершено.
     * @param to целевой объект Route, к которому осуществляется переход.
     * @param from текущий маршрут, с которого осуществляется переход к новому.
     * @param next функция, вызов которой разрешает навигацию. В зависимости от переданных в <code>next</code> аргументов, результатом будет:
     * <ul>
     *     <li><code>next()</code>: переход к следующему хуку в цепочке. Если хуков больше нет, переход считается подтверждённым.</li>
     *     <li><code>next(false)</code>: отмена перехода. Если URL был изменён (вручную пользователем, или кнопкой "назад"), он будет сброшен на соответствующий
     *     маршрут <code>from</code>.</li>
     *     <li><code>next('/')</code> или <code>next({ path: '/' })</code>: перенаправление на другой маршрут. Текущий переход будет отменён, и процесс начнётся
     *     заново для нового маршрута. Вы можете передать любой объект местоположения в <code>next</code>, который позволяет вам указывать опции такие как
     *     <code>replace: true, name: 'home'</code> и любой другой параметр используемый во входном параметре <code>to</code> компонента
     *     <code>router-link</code> или функции <code>router.push</code></li>
     *     <li><code>next(error)</code>: если аргумент, переданный <code>next</code>, является экземпляром <code>Error</code>, навигация будет прервана и
     *     ошибка будет передана в коллбэк, зарегистрированный через <code>router.onError()</code>.</li>
     * </ul>
     */
    beforeRouteLeave?(to: Route, from: Route, next: Resolver): void;
}