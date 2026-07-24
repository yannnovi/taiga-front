import { Component, Inject, Input } from "@angular/core";
import { AJS_AVATAR_SERVICE } from "../shared/ajs-tokens";

/**
 * Angular replacement for the AngularJS `tgSingleMember` directive
 * (app/modules/projects/create/invite-members/single-member/), downgraded in place under
 * the same name. `tg-avatar` (template-less) replicated inline via `tgAvatarService`, same
 * pattern as elsewhere in this migration.
 */
@Component({
    selector: "tg-single-member",
    templateUrl: "./single-member.component.html",
})
export class SingleMemberComponent {
    @Input() disabled: any;
    @Input() avatar: any;

    constructor(@Inject(AJS_AVATAR_SERVICE) private avatarService: any) {}

    getAvatarUrl(): string {
        return this.avatarService.getAvatar(this.avatar).url;
    }
}
