<template>
	<div class="modal-background" @click.prevent="hideModal">
		<div class="modal" @click.prevent.stop="() => false">
			<template v-if="tag">
				<div class="modal-header">
					{{ tag.name }}
				</div>
				<div v-if="moderator" class="modal-tabs">
					<div class="modal-tabs-topbar">
						<button :class="{ 'modal-tab-button': true, active: activeTab === 'tagEditor' }" @click.prevent="switchTab('tagEditor')">
							Editor
						</button>
						<button :class="{ 'modal-tab-button': true, active: activeTab === 'tagPreview' }" @click.prevent="switchTab('tagPreview')">
							Preview
						</button>
					</div>
					<GuildSettings v-if="activeTab === 'guildSettings'" />
					<GuildTags v-if="activeTab === 'guildTags'" />
				</div>
				<div v-if="moderator && activeTab === 'tagEditor'" class="modal-content no-overflow">
					<textarea v-model="tag.content" />
				</div>
				<div v-else-if="activeTab === 'tagPreview'" class="modal-content">
					<span v-html="tagContent()" />
				</div>
				<div v-if="moderator" id="inputSubmit">
					<button :disabled="!moderator" @click="post">
						Submit
					</button>
					<button :disabled="!moderator" @click="reset">
						Reset
					</button>
				</div>
			</template>
			<template v-if="loading">
				<div class="loading">
					<Loading />
					<pre>{{ message }}</pre>
				</div>
			</template>
		</div>
	</div>
</template>

<script lang="ts">
import { Component, Vue, State, Getter, Action } from 'nuxt-property-decorator';
import gql from 'graphql-tag';
const discordMarkdown = require('discord-markdown'); // eslint-disable-line

@Component({
	components: {
		Loading: () => import('./Loading.vue')
	}
})
export default class GuildTagsModalComponent extends Vue {
	@State('selectedGuild')
	public currentGuild!: any;

	@Getter
	public selectedGuild!: any;

	@Getter
	public selectedTag!: any;

	@Getter
	public tagModal!: any;

	@Action
	public showTagModal!: any;

	public md = discordMarkdown.toHTML;

	public activeTab = 'tagPreview';

	public tag: any = null;

	public resetTag: any = null;

	public message = 'Loading...';

	public loading = true;

	public async mounted() {
		document.body.classList.add('no-scroll');

		try {
			// @ts-ignore
			const { data } = await this.$apollo.query({
				query: gql`query tag($id: Int!) {
					tag(id: $id) {
						id
						user {
							id
							tag
						}
						guild {
							id
						}
						name
						content
					}
				}`,
				variables: {
					id: parseInt(this.selectedTag, 10)
				}
			});

			this.tag = data.tag;
			this.resetTag = { ...data.tag };
		} catch {
			this.tag = null;
			this.resetTag = null;
			this.loading = false;
		}

		if (!this.tag) this.message = 'Not in this guild || No tags.';
		if (this.tag) this.loading = false;
	}

	public beforeDestroy() {
		document.body.classList.remove('no-scroll');
	}

	public get moderator() {
		return this.currentGuild.member && this.currentGuild.member.roles.some((r: { id: string }) => r.id === this.currentGuild.settings.modRole);
	}

	public tagContent() {
		// Only embed pure image links
		const linkRegex = /^https?:\/\/(?:\w+\.)?[\w-]+\.[\w]{2,3}(?:\/[\w-_.]+)+\.(?:png|jpg|jpeg|gif|gifv|webp).*$/;
		const linkMatch = this.tag.content.match(linkRegex);
		if (linkMatch) {
			return `<img src="${linkMatch[0]}">`;
		}
		return this.md(this.tag.content);
	}

	public switchTab(key: string) {
		this.activeTab = key;
	}

	public hideModal() {
		this.showTagModal(!this.tagModal);
	}

	public async post() {
		this.loading = true;
		this.message = 'Loading...';
		try {
			// @ts-ignore
			const { data } = await this.$apollo.mutate({
				mutation: gql`mutation editTag($id: Int!, $guild_id: String!, $data: EditTagInput!) {
					editTag(id: $id, guild_id: $guild_id, data: $data) {
						id
						user {
							id
							tag
						}
						guild {
							id
						}
						name
						content
					}
				}`,
				variables: {
					id: this.tag.id,
					guild_id: this.tag.guild.id,
					data: {
						content: this.tag.content
					}
				}
			});

			this.tag = data.editTag;
			this.resetTag = { ...data.editTag };
			this.activeTab = 'tagPreview';
		} catch {
			this.tag = null;
			this.resetTag = null;
			this.loading = false;
		}

		if (this.tag) this.loading = false;
	}

	public reset() {
		this.tag = { ...this.resetTag };
	}
}
</script>

<style lang="scss" scoped>
	$family-primary: 'Nunito', 'Roboto', sans-serif;

	.no-overflow {
		overflow: unset !important;
	}

	.modal-background {
		height: 100%;
		width: 100%;
		display: grid;
		grid-template-columns: minmax(10rem, 60rem);
		justify-content: center;
		align-items: center;
		background: rgba(0, 0, 0, 0.75);
		position: fixed;
		overflow-y: auto;

		> .modal {
			display: grid;
			grid-column: 1 / -1;
			min-width: 18rem;
			background: rgba(20, 20, 20, 1);
			overflow-wrap: break-word;
			padding: .3rem .5rem 1rem .3rem;

			> .modal-header {
				font-weight: 600;
				text-align: center;
				margin: 1rem;
			}

			> .modal-tabs {
				display: grid;

				> .modal-tabs-topbar {
					display: grid;
					justify-items: center;
					justify-content: center;
					grid-template-columns: minmax(6rem, 10rem) minmax(6rem, 10rem);
					margin: 0 1rem 1rem 1rem;

					> .modal-tab-button {
						color: #FFFFFF;
						border: none;
						border-bottom: 1px transparent solid;
						background: none;
						outline: none;
						height: 45px;
						cursor: pointer;

						&.active {
							border-bottom: 1px #FFFFFF solid;
						}

						&:active {
							border-bottom: 1px #FFFFFF solid;
						}

						// TODO: remove, just for dev
						&:focus {
							border-bottom: 1px #FFFFFF solid;
						}
					}
				}
			}

			> .modal-content {
				padding: .3rem 1rem 2rem 1rem;
				overflow: auto;

				> textarea {
					height: 10rem;
					width: 100%;
				}
			}

			> .modal-footer {
				font-size: .8rem;
				padding: .5rem;
				align-self: end;
				justify-self: end;
			}

			> #inputSubmit {
				display: grid;
				justify-content: center;
				grid-template-columns: minmax(4rem, 6rem) minmax(4rem, 6rem);
				grid-gap: 1rem;

				> button {
					background: rgba(13, 13, 14, .7);
					border: none;
					color: #FFFFFF;
					padding: 1rem;
					outline: none;
					cursor: pointer;

					&:disabled {
						opacity: .5;
						pointer-events: none;
					}
				}
			}

			> .loading {
				display: grid;
				justify-content: center;
				justify-items: center;
				padding-top: 1.5rem;
			}
		}
	}
</style>
