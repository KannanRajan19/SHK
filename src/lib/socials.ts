export type Social = {
  label: string;
  handle: string;
  note: string;
};

/** Trims every field, so a stray space never reaches the page. */
export function normaliseSocial(social: Social): Social {
  return {
    label: (social.label ?? '').trim(),
    handle: (social.handle ?? '').trim(),
    note: (social.note ?? '').trim(),
  };
}

/**
 * The links the contact page should actually render.
 *
 * Clearing a handle is how the owner hides a link she no longer uses, without
 * having to delete the row — so an empty handle (or label) means "not shown",
 * not "show a blank line". Deleting the row removes it entirely; both routes
 * exist deliberately.
 */
export function visibleSocials(socials: Social[]): Social[] {
  return socials
    .map(normaliseSocial)
    .filter((s) => s.label !== '' && s.handle !== '');
}
