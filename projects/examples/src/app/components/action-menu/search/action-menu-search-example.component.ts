/*!
 * Copyright 2019 VMware, Inc.
 * SPDX-License-Identifier: BSD-2-Clause
 */

import { Component, OnDestroy, OnInit } from '@angular/core';
import { TranslationService } from '@vcd/i18n';
import {
    ActionDisplayConfig,
    ActionItem,
    ActionSearchProvider,
    ActionStyling,
    ActionType,
    DEFAULT_ACTION_SEARCH_SECTION_HEADER_PREFIX,
    QuickSearchService,
    TextIcon,
} from '@vcd/ui-components';
import Mousetrap from 'mousetrap';

interface Record {
    value: string;
    paused: boolean;
}

interface HandlerData {
    foo: string;
    bar: string;
}

@Component({
    selector: 'vcd-action-search-example',
    templateUrl: 'action-menu-search-example.component.html',
    styleUrls: ['action-menu-search-example.component.scss'],
})
export class ActionMenuSearchExampleComponent<R extends Record, T extends HandlerData> implements OnInit, OnDestroy {
    constructor(private spotlightSearchService: QuickSearchService, private translationService: TranslationService) {}

    kbdShortcut = 'mod+.';
    spotlightOpen: boolean;

    actions: ActionItem<R, T>[] = [
        {
            textKey: 'Static Featured 1',
            handler: () => console.log('Static Featured 1'),
            availability: () => true,
            actionType: ActionType.STATIC_FEATURED,
            isTranslatable: false,
        },
        {
            textKey: 'Static 1',
            handler: (rec: R[], data: T) => console.log('Static 1 with custom handler data: ', JSON.stringify(data)),
            handlerData: { foo: 'foo', bar: 'bar' } as T,
            availability: () => true,
            actionType: ActionType.STATIC,
            isTranslatable: false,
        },
        {
            textKey: 'Contextual 1',
            availability: (rec: R[]) => rec.length === 1,
            handler: () => console.log('Contextual 1'),
            isTranslatable: false,
        },
        {
            textKey: 'Contextual featured',
            actionType: ActionType.CONTEXTUAL_FEATURED,
            handler: () => console.log('Contextual featured'),
            isTranslatable: false,
        },
        {
            textKey: 'power.actions',
            children: [
                {
                    textKey: 'Start',
                    handler: (rec: R[]) => {
                        console.log('Starting ' + rec[0].value);
                        rec[0].paused = false;
                        this.selectedEntities = rec;
                    },
                    availability: (rec: R[]) => rec.length === 1 && rec[0].paused,
                    actionType: ActionType.CONTEXTUAL_FEATURED,
                    isTranslatable: false,
                    class: 'start',
                },
                {
                    textKey: 'Stop',
                    handler: (rec: R[]) => {
                        console.log('Stopping ' + (rec as R[])[0].value);
                        rec[0].paused = true;
                        this.selectedEntities = rec;
                    },
                    availability: (rec: R[]) => rec.length === 1 && !rec[0].paused,
                    actionType: ActionType.CONTEXTUAL_FEATURED,
                    isTranslatable: false,
                    class: 'stop',
                },
            ],
        },
        {
            textKey: 'No children action',
            actionType: ActionType.CONTEXTUAL,
            children: [],
        },
    ];

    actionDisplayConfig: ActionDisplayConfig = {
        contextual: {
            featuredCount: 2,
            styling: ActionStyling.INLINE,
            buttonContents: TextIcon.TEXT,
        },
    };

    private _selectedEntities: Record[] = [{ value: 'Selected entity', paused: false }] as R[];
    set selectedEntities(val: Record[]) {
        this._selectedEntities = [...val];
        this.actionSearchProvider.selectedEntities = val;
    }
    get selectedEntities(): Record[] {
        return this._selectedEntities;
    }

    private actionProviderName = 'actionMenuExampleComponent';

    actionSearchProvider = new ActionSearchProvider(this.translationService);

    ngOnInit(): void {
        const mousetrap = new Mousetrap();
        const originalStopCallback = mousetrap.stopCallback;
        mousetrap.stopCallback = (e: ExtendedKeyboardEvent, element: Element, combo: string): boolean => {
            // If a modifier key is used then do not stop the callback from being called despite of the event origin
            // i.e. `ctrl+.` on input fields should not stop the callback,
            // while `.` should stop it and echo `.` in the input
            if (['command'].some((key) => combo.includes(key))) {
                return false;
            }
            return originalStopCallback.call(mousetrap, e, element, combo);
        };

        mousetrap.bind(this.kbdShortcut, () => {
            this.spotlightOpen = true;
            return false;
        });
        this.actionSearchProvider.actions = this.actions;
        this.actionSearchProvider.selectedEntities = this.selectedEntities;
        this.actionSearchProvider.sectionName = this.translationService.translate(
            DEFAULT_ACTION_SEARCH_SECTION_HEADER_PREFIX,
            [{ actionProviderName: this.actionProviderName || '' }]
        );

        this.spotlightSearchService.registerProvider(this.actionSearchProvider);
    }

    ngOnDestroy(): void {
        this.spotlightSearchService.unregisterProvider(this.actionSearchProvider);
    }
}
