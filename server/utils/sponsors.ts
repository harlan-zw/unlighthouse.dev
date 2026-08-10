import type { Sponsorship } from 'sponsorkit'

export interface SponsorGroups {
  others: Sponsorship[]
  $25: Sponsorship[]
  $50: Sponsorship[]
}

function normalizeSponsor(sponsorship: Sponsorship): Sponsorship {
  const sponsor = { ...sponsorship.sponsor }

  if (sponsor.name === 'Kintell-labs') {
    sponsor.name = 'Kintell'
    sponsor.websiteUrl = 'https://kintell.com'
  }
  if (sponsor.name === 'Massive Monster')
    sponsor.websiteUrl = 'https://massivemonster.co'

  return { ...sponsorship, sponsor }
}

export function preparePublicSponsors(sponsorships: readonly Sponsorship[]): SponsorGroups {
  return sponsorships
    .filter(sponsorship => sponsorship.privacyLevel === 'PUBLIC')
    .map(normalizeSponsor)
    .reduce<SponsorGroups>((groups, sponsorship) => {
      if (sponsorship.monthlyDollars >= 50)
        groups.$50.push(sponsorship)
      else if (sponsorship.monthlyDollars >= 25)
        groups.$25.push(sponsorship)
      else
        groups.others.push(sponsorship)

      return groups
    }, {
      others: [],
      $25: [],
      $50: [],
    })
}
