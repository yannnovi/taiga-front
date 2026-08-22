###
# This source code is licensed under the terms of the
# GNU Affero General Public License found in the LICENSE file in
# the root directory of this source tree.
#
# Copyright (c) 2021-present Kaleidos INC
###

# `tgLbFeedback` used to be defined here - migrated to `LightboxFeedbackComponent`
# (src/app/lightbox-feedback/), downgraded onto this same module in register-legacy.ts.
# This file now only owns the module's defining declaration (`taigaFeedback`, listed as an
# app.coffee dependency) - `feedback.service.coffee`'s `tgFeedbackService` looks it up via
# the getter form and needs it to exist somewhere.
module = angular.module("taigaFeedback", [])
