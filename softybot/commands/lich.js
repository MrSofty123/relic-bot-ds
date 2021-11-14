const { SlashCommandBuilder } = require('@discordjs/builders');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('lich')
		.setDescription('Post a new lich order')
		.addStringOption(option =>
			option.setName('weapon')
				.setDescription('Select weapon')
				.setRequired(true)
				.addChoice('Kuva hek', 'kuva_hek')
				.addChoice('Tenet cycron', 'tenet_cycron')
				.addChoice('Kuva kohm', 'kuva_kohm'))
		.addStringOption(option =>
			option.setName('element')
				.setDescription('Select damage element')
				.setRequired(true)
				.addChoice('Impact', 'impact')
				.addChoice('Heat', 'heat')
				.addChoice('Cold', 'cold')
				.addChoice('Electricity', 'electricity')
				.addChoice('Toxin', 'toxin')
				.addChoice('Magnetic', 'magnetic')
				.addChoice('Radiation', 'radiation'))
		.addNumberOption(option => 
			option.setName('damage')
				.setDescription('Input damage %')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('quirk')
				.setDescription('Select quirk')
				.setRequired(true)
				.addChoice('Allergic to Nature', 'allergic_to_nature')
				.addChoice('Always Hungry', 'always_hungry')
				.addChoice('Bloodhound', 'bloodhound')
				.addChoice('Coward', 'coward')
				.addChoice('Deserter', 'deserter')
				.addChoice('Fear of Being Alone', 'fear_of_being_alone')
				.addChoice('Fear of Children', 'fear_of_children')
				.addChoice('Fear of Kubrows', 'fear_of_kubrows')
				.addChoice('Fear of Space Travel', 'fear_of_space_travel')
				.addChoice('Hatred of Corpus', 'hatred_of_corpus')
				.addChoice('Hatred of Infested', 'hatred_of_infested')
				.addChoice('Loner', 'loner')
				.addChoice('Paranoid', 'paranoid')
				.addChoice('Poor Sense of Balance', 'poor_sense_of_balance')
				.addChoice('Prone to Vertigo', 'prone_to_vertigo')
				.addChoice('Pyromaniac', 'pyromaniac')
				.addChoice('Trophy Hunter', 'trophy_hunter')
				.addChoice('Vain', 'vain'))
		.addBooleanOption(option =>
			option.setName('ephemera')
				.setDescription('Includes ephmera?')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('name')
				.setDescription('Input lich name')
				.setRequired(true))
		.addIntegerOption(option =>
			option.setName('price')
				.setDescription('Input buy price')
				.setRequired(true))
		.addStringOption(option =>
			option.setName('order_type')
				.setDescription('Order type')
				.setRequired(true)
				.addChoice('Sell order', 'wts')
				.addChoice('Buy order', 'wtb'))
};