import { Component, ElementRef, EventEmitter, Inject, Input, Output } from "@angular/core";
import { CdkDragDrop } from "@angular/cdk/drag-drop";
import {
    AJS_ACTIVITY_SERVICE,
    AJS_ANALYTICS,
    AJS_ATTACHMENTS_FULL_SERVICE,
    AJS_AVATAR_SERVICE,
    AJS_CONFIRM,
    AJS_QUEUE,
    AJS_REPO,
    AJS_ROOT_SCOPE,
    AJS_TRANSLATE,
} from "../shared/ajs-tokens";

declare const moment: any;

function hasPerm(project: any, perm: string): boolean {
    return !!project && project.my_permissions.indexOf(perm) !== -1;
}

/**
 * Was `tgWikiNav` (`app/coffee/modules/wiki/nav.coffee`): the wiki links sidebar of the wiki
 * page and the wiki pages list. The original read `$scope.project`/`projectId`/`wikiLinks`
 * ambiently, re-rendered a lodash template by hand after every change and sorted with
 * dragula. Now explicit inputs; the parent controller still owns the list:
 * - reordering broadcasts `wiki:links:move` (link, newIndex) as before, handled by
 *   `WikiDetailController.moveLink` (the wiki pages list controller never handled it, so
 *   reordering there was never persisted - unchanged);
 * - after a create/delete, `reloadLinks` asks the controller to `loadWikiLinks()`, whose new
 *   `wikiLinks` flows back in through the input (the original reloaded then re-rendered).
 */
@Component({
    selector: "tg-wiki-nav",
    templateUrl: "./wiki-nav.component.html",
})
export class WikiNavComponent {
    @Input() links: any[] = [];
    @Input() project: any;
    /** Slug of the page being shown (wiki page only) - highlights its link. */
    @Input() activeSlug: string | undefined;

    @Output() reloadLinks = new EventEmitter<void>();

    showNew = false;
    newTitle = "";
    creating = false;

    readonly spinnerSrc = `${(window as any)._version}/svg/spinner-circle.svg`;

    constructor(
        private elementRef: ElementRef<HTMLElement>,
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_TRANSLATE) private translate: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
    ) {}

    get canAdd(): boolean {
        return hasPerm(this.project, "add_wiki_link");
    }

    get canDelete(): boolean {
        return hasPerm(this.project, "delete_wiki_link");
    }

    trackById(_index: number, link: any): any {
        return link.id;
    }

    openNew(event: Event): void {
        event.preventDefault();
        this.showNew = true;
        setTimeout(() => (this.elementRef.nativeElement.querySelector(".new input") as HTMLInputElement | null)?.focus());
    }

    private closeNew(): void {
        this.showNew = false;
        this.newTitle = "";
    }

    onNewKeyup(event: KeyboardEvent): void {
        event.preventDefault();

        if (event.key === "Escape") {
            this.closeNew();
            return;
        }

        if (event.key !== "Enter" || this.creating) {
            return;
        }

        const title = this.newTitle;
        this.creating = true;

        this.repo.create("wiki-links", { project: this.project.id, title }).then(
            () => {
                this.creating = false;
                this.analytics.trackEvent("wikilink", "create", "create wiki link", 1);
                this.closeNew();
                this.reloadLinks.emit();
            },
            (error: any) => {
                this.creating = false;
                this.newTitle = title;
                setTimeout(() => (this.elementRef.nativeElement.querySelector(".new input") as HTMLInputElement | null)?.select());

                if (error?.__all__?.[0] != null) {
                    this.confirm.notify("error", "The link already exists");
                } else {
                    this.confirm.notify("error");
                }
            },
        );
    }

    deleteLink(link: any, event: Event): void {
        event.preventDefault();
        event.stopPropagation();

        const title = this.translate.instant("WIKI.DELETE_LINK_TITLE");

        this.confirm.askOnDelete(title, link.title).then((askResponse: any) => {
            this.repo.remove(link).then(
                () => {
                    askResponse.finish();
                    this.reloadLinks.emit();
                },
                () => {
                    askResponse.finish(false);
                    this.confirm.notify("error");
                },
            );
        });
    }

    drop(event: CdkDragDrop<any[]>): void {
        if (event.previousIndex === event.currentIndex) {
            return;
        }

        this.rootScope.$broadcast("wiki:links:move", event.item.data, event.currentIndex);
    }
}

/** Was `tgWikiSummary`: last modifier, last edit date, number of editions, delete icon. */
@Component({
    selector: "tg-wiki-summary",
    template: `
        <ng-container *ngIf="wiki">
            <div class="wiki-username-edition">
                <div class="avatar">
                    <img [style.background-color]="avatar.bg" [src]="avatar.url" [alt]="userName" />
                </div>
                <div class="wiki-user-modification">
                    <span class="description">{{ "WIKI.SUMMARY.LAST_MODIFICATION" | tgTranslate }}</span>
                    <span class="username">{{ userName }}</span>
                </div>
            </div>
            <div class="wiki-last-modified">
                <span class="number">{{ lastModifiedDate }}</span>
                <span class="description" [innerHTML]="'WIKI.SUMMARY.LAST_EDIT' | tgTranslate"></span>
            </div>
            <div class="wiki-times-edited">
                <span class="number">{{ wiki.editions }}</span>
                <span class="description" [innerHTML]="'WIKI.SUMMARY.TIMES_EDITED' | tgTranslate"></span>
            </div>
            <tg-svg
                *ngIf="canDelete && wiki.id"
                class="remove"
                svg-icon="icon-trash"
                [svgTitle]="'WIKI.REMOVE' | tgTranslate"
                (click)="deletePage.emit()"
            ></tg-svg>
        </ng-container>
    `,
})
export class WikiSummaryComponent {
    @Input() wiki: any;
    @Input() usersById: any = {};
    @Input() project: any;

    @Output() deletePage = new EventEmitter<void>();

    constructor(
        @Inject(AJS_AVATAR_SERVICE) private avatarService: any,
        @Inject(AJS_TRANSLATE) private translate: any,
    ) {}

    private get user(): any {
        return this.wiki ? this.usersById?.[this.wiki.last_modifier] : undefined;
    }

    get avatar(): { url: string; bg: string } {
        return this.avatarService.getAvatar(this.user);
    }

    get userName(): string {
        return this.user ? this.user.full_name_display : "unknown";
    }

    get lastModifiedDate(): string {
        return moment(this.wiki.modified_date).format(this.translate.instant("WIKI.DATETIME"));
    }

    /** Was `tg-check-permission="delete_wiki_page"` on the icon. */
    get canDelete(): boolean {
        return hasPerm(this.project, "delete_wiki_page");
    }
}

/**
 * Was `tgWikiWysiwyg` (`scope: true`, read `$scope.project` ambiently): the wiki page
 * content, editable through the `tg-wysiwyg` wrapper or rendered read-only.
 *
 * Fixed while porting: after creating a page, the original's success handler referenced
 * an undefined `project` variable (`project.get("archived_code")`) and threw before the
 * activity refresh and the success notification - a newly created page got neither.
 */
@Component({
    selector: "tg-wiki-wysiwyg",
    template: `
        <div *ngIf="item && project">
            <tg-wysiwyg
                *ngIf="editable"
                [htmlReadMode]="true"
                [placeholder]="'COMMON.DESCRIPTION.EMPTY' | tgTranslate"
                [version]="item.version"
                [project]="project"
                [storageKey]="storageKey"
                [content]="item.content"
                [onUploadFile]="uploadFiles"
                (onSave)="save($event)"
            ></tg-wysiwyg>

            <div class="wysiwyg" *ngIf="!editable && item.content?.length" [tgWysiwygHtml]="item.content"></div>
            <div class="wysiwyg" *ngIf="!editable && !item.content?.length">{{ "COMMON.DESCRIPTION.NO_DESCRIPTION" | tgTranslate }}</div>
        </div>
    `,
})
export class WikiWysiwygComponent {
    @Input() item: any;
    @Input() project: any;

    constructor(
        @Inject(AJS_REPO) private repo: any,
        @Inject(AJS_QUEUE) private qqueue: any,
        @Inject(AJS_CONFIRM) private confirm: any,
        @Inject(AJS_ANALYTICS) private analytics: any,
        @Inject(AJS_ROOT_SCOPE) private rootScope: any,
        @Inject(AJS_ACTIVITY_SERVICE) private activityService: any,
        @Inject(AJS_ATTACHMENTS_FULL_SERVICE) private attachmentsFullService: any,
    ) {}

    get editable(): boolean {
        if (!this.project || this.project.archived_code) {
            return false;
        }

        return hasPerm(this.project, this.item?.id != null ? "modify_wiki_page" : "add_wiki_page");
    }

    get storageKey(): string {
        return `${this.project.id}-${this.item.id}-wiki`;
    }

    save(event: { text: string; cb: () => void }): void {
        this.qqueue.add(() => {
            const isNew = this.item.id == null;
            this.item.content = event.text;

            const request = isNew ? this.repo.create("wiki", this.item) : this.repo.save(this.item);

            return request
                .then(
                    () => {
                        if (isNew) {
                            this.analytics.trackEvent("wikipage", "create", "create wiki page", 1);
                            this.rootScope.$broadcast("wikipage:add");
                        }

                        this.activityService.fetchEntries(true);
                        this.confirm.notify("success");
                    },
                    () => this.confirm.notify("error"),
                )
                .finally(() => event.cb?.());
        });
    }

    /** Arrow function: called by `tg-wysiwyg` as a bare callback. */
    uploadFiles = (file: any, cb: (result: { default: string }) => void): void => {
        this.attachmentsFullService.addAttachment(this.project.id, this.item.id, "wiki_page", file).then((result: any) => {
            cb({ default: result.getIn(["file", "url"]) });
        });
    };
}
