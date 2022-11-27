import { Router } from "@angular/router";
import { AppComponent } from "../app.component";

export interface MenuItem {
    parent?: MenuItem;
    label: string;
    url: string;
    children?: MenuItem[];
}

export interface Breadcrumb {
    label: string;
    url: string;
}

export const menuItems: MenuItem[] = [
    {
        label: 'dashboard',
        url: '/dashboard',
        children: [
            {
                label: 'my_surveys',
                url: '/dashboard/my-surveys',
                children: [
                    {
                        label: '..',
                        url: '/dashboard/my-surveys/:address',
                        children: [
                            {
                                label: 'answers',
                                url: '/dashboard/my-surveys/:address/answers'
                            }
                        ]
                    }
                ]
            },
            {
                label: 'my_participations',
                url: '/dashboard/my-parts',
                children: [
                    {
                        label: '..',
                        url: '/dashboard/my-parts/:address',
                        children: [
                            {
                                label: 'answers',
                                url: '/dashboard/my-parts/:address/answers'
                            }
                        ]
                    }
                ]
            }
        ]
    },
    {
        label: 'surveys',
        url: '/surveys',
        children: [
            {
                label: '..',
                url: '/surveys/:address',
                children: [
                    {
                        label: 'take_survey',
                        url: '/take-survey'
                    },
                    {
                        label: 'participation_status',
                        url: '/take-survey/status'
                    },
                    {
                        label: 'answers',
                        url: '/surveys/:address/answers'
                    }
                ]
            }
        ]
    },
    {
        label: 'create_survey',
        url: '/create-survey',
        children: [
            {
                label: 'preview',
                url: '/create-survey/preview'
            },
            {
                label: 'survey_status',
                url: '/create-survey/status'
            }
        ]
    },
    {
        label: 'swap',
        url: '/swap'
    }
];

function findItem(url: string, items: MenuItem[] = menuItems, parent: MenuItem = undefined): MenuItem {
    for (let item of items) {
        item.parent = parent;

        if (item.url == url) {
            return item;
        }

        if (item.children) {
            let result = findItem(url, item.children, item);

            if (result) {
                return result;
            }
        }
    }

    return undefined;
}

export function getBreadcrumbs(url: string): Breadcrumb[] {
    let breadcrumbs: Breadcrumb[] = [];
    let match = url.match(/.+\/(0x[a-zA-Z0-9]+)\/?.*$/);

    if (match) {
        url = url.replace(match[1], ':address');
    }

    let item = findItem(url);

    if (item) {
        let items = [];
        items.push(item);

        let parent;

        while ((parent = item.parent)) {
            items.push(parent);
            item = parent;
        }

        for (let i = items.length - 1; i >= 0; i--) {
            breadcrumbs.push({
                label: items[i].label,
                url: items[i].url,
            });
        }
    }

    return breadcrumbs;
}

export function setBreadcrumb(url: string, breadcrumb: Breadcrumb) {
    let breadcrumbs = AppComponent.instance.breadcrumbs;

    for (let i = 0; i < breadcrumbs.length; i++) {
        if (breadcrumbs[i].url == url) {
            breadcrumbs[i] = breadcrumb;
            break;
        }
    }
}

/*export function isRouteFromDashboard(route: string) {
    return route.startsWith('/dashboard/');
}*/

export function isRouteFromDashboardMySurveys(route: string) {
    return route.startsWith('/dashboard/my-surveys');
}

export function isRouteFromDashboardMyParts(route: string) {
    return route.startsWith('/dashboard/my-parts');
}

export function setBreadcrumbForDetails(router: Router, surveyAddr: string, surveyTitle: string) {
    if(isRouteFromDashboardMySurveys(router.url)) {
        setBreadcrumb('/dashboard/my-surveys/:address', { url: '/dashboard/my-surveys/' + surveyAddr, label: surveyTitle });
    } else if(isRouteFromDashboardMyParts(router.url)) {
        setBreadcrumb('/dashboard/my-parts/:address', { url: '/dashboard/my-parts/' + surveyAddr, label: surveyTitle });
    } else {
        setBreadcrumb('/surveys/:address', { url: '/surveys/' + surveyAddr, label: surveyTitle });
    }
}
