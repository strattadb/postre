import { greenBright, redBright } from 'colorette';

import { loadConfiguration, MigrationConfiguration } from '../config';
import { Client } from '../clients';
import { spinner } from '../helpers';

import { MigrationId } from './types';
import {
  setupClient,
  checkIfMigrationIdIsValid,
  hasMigrationBeenMigrated,
  makeDurationInSecondsString,
} from './helpers';
import {
  createSchemaMigrationsTableIfItDoesntExist,
  deleteFromSchemaMigrationsTable,
  lockMigrationsTable,
  getMigratedMigrationIds,
} from './schemaMigrationsTable';
import {
  findAndImportAllMigrations,
  Migration,
  createMigrationFilesDirectory,
} from './migrationFiles';

export type RollbackArgs = {
  toMigrationId?: MigrationId;
  all?: boolean;
};

export async function rollback(args: RollbackArgs): Promise<void> {
  const configuration = await loadConfiguration();

  await createMigrationFilesDirectory(configuration);

  const migrations = await findAndImportAllMigrations(configuration);

  const schemaMigrationsTableClient = await setupClient(configuration);

  await createSchemaMigrationsTableIfItDoesntExist(
    schemaMigrationsTableClient,
    configuration,
  );

  let migrationsClient: Client | undefined = undefined;

  let rollbackedMigrations = 0;
  const startTimestamp = Date.now();

  try {
    migrationsClient = await setupClient(configuration);

    if (args.toMigrationId) {
      rollbackedMigrations = await rollbackTo(
        migrationsClient,
        schemaMigrationsTableClient,
        configuration,
        args.toMigrationId,
        migrations,
      );
    } else if (args.all) {
      rollbackedMigrations = await rollbackAll(
        migrationsClient,
        schemaMigrationsTableClient,
        configuration,
        migrations,
      );
    } else {
      rollbackedMigrations = await rollbackOne(
        migrationsClient,
        schemaMigrationsTableClient,
        configuration,
        migrations,
      );
    }
  } catch (error) {
    spinner.fail('no migrations were rollbacked due to an error');

    throw error;
  } finally {
    if (migrationsClient) {
      await migrationsClient.disconnect();
    }

    await schemaMigrationsTableClient.disconnect();
  }

  const finishTimestamp = Date.now();
  const durationInSecondsString = makeDurationInSecondsString(
    startTimestamp,
    finishTimestamp,
  );

  spinner.succeed(
    `rollbacked ${rollbackedMigrations} migrations in ${durationInSecondsString} seconds`,
  );
}

async function rollbackTo(
  migrationsClient: Client,
  schemaMigrationsTableClient: Client,
  configuration: MigrationConfiguration,
  toMigrationId: MigrationId,
  migrations: Migration[],
): Promise<number> {
  checkIfMigrationIdIsValid(migrations, toMigrationId);

  let rollbackedMigrations = 0;
  const reversedMigrations = [...migrations].reverse();

  for (const migration of reversedMigrations) {
    if (migration.id < toMigrationId) {
      break;
    }

    const wasRollbacked = await rollbackMigration(
      migrationsClient,
      schemaMigrationsTableClient,
      configuration,
      migration,
    );

    if (wasRollbacked) {
      rollbackedMigrations += 1;
    }
  }

  return rollbackedMigrations;
}

async function rollbackAll(
  migrationsClient: Client,
  schemaMigrationsTableClient: Client,
  configuration: MigrationConfiguration,
  migrations: Migration[],
): Promise<number> {
  const earliestMigration = migrations[0];

  return rollbackTo(
    migrationsClient,
    schemaMigrationsTableClient,
    configuration,
    earliestMigration.id,
    migrations,
  );
}

async function rollbackOne(
  migrationsClient: Client,
  schemaMigrationsTableClient: Client,
  configuration: MigrationConfiguration,
  migrations: Migration[],
): Promise<number> {
  const rollbackedMigrations = await rollbackN(
    migrationsClient,
    schemaMigrationsTableClient,
    configuration,
    1,
    migrations,
  );

  return rollbackedMigrations;
}

async function rollbackN(
  migrationsClient: Client,
  schemaMigrationsTableClient: Client,
  configuration: MigrationConfiguration,
  numberOfMigrationsToRollback: number,
  migrations: Migration[],
): Promise<number> {
  let rollbackedMigrations = 0;
  const reversedMigrations = [...migrations].reverse();

  for (const migration of reversedMigrations) {
    if (rollbackedMigrations === numberOfMigrationsToRollback) {
      break;
    }

    const wasRollbacked = await rollbackMigration(
      migrationsClient,
      schemaMigrationsTableClient,
      configuration,
      migration,
    );

    if (wasRollbacked) {
      rollbackedMigrations += 1;
    }
  }

  return rollbackedMigrations;
}

async function rollbackMigration(
  migrationsClient: Client,
  schemaMigrationsTableClient: Client,
  configuration: MigrationConfiguration,
  migration: Migration,
): Promise<boolean> {
  spinner.start(`rollbacking ${greenBright(migration.filename)}`);

  const startTimestamp = Date.now();

  const wasRollbacked = await schemaMigrationsTableClient.doInTransaction(
    async (schemaMigrationsTableTransaction) => {
      await lockMigrationsTable(
        schemaMigrationsTableTransaction,
        configuration,
      );

      const migratedMigrationIds = await getMigratedMigrationIds(
        schemaMigrationsTableTransaction,
        configuration,
      );

      if (!hasMigrationBeenMigrated(migratedMigrationIds, migration.id)) {
        return false;
      }

      try {
        await (migration.disableTransaction
          ? migration.rollback(migrationsClient)
          : migrationsClient.doInTransaction(async (transaction) => {
              await migration.rollback(transaction);
            }));
      } catch (error) {
        spinner.fail(`${redBright(migration.filename)} failed to rollback`);

        throw error;
      }

      await deleteFromSchemaMigrationsTable(
        schemaMigrationsTableTransaction,
        configuration,
        migration.id,
      );

      return true;
    },
  );

  const finishTimestamp = Date.now();
  const durationInSecondsString = makeDurationInSecondsString(
    startTimestamp,
    finishTimestamp,
  );

  if (wasRollbacked) {
    spinner.succeed(
      `${greenBright(
        migration.filename,
      )} rollbacked in ${durationInSecondsString} seconds`,
    );
  }

  return wasRollbacked;
}
