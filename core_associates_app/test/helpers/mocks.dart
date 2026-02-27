import 'package:mocktail/mocktail.dart';

import 'package:core_associates_app/core/api/api_client.dart';
import 'package:core_associates_app/core/storage/secure_storage.dart';
import 'package:core_associates_app/features/auth/data/auth_repository.dart';
import 'package:core_associates_app/features/profile/data/profile_repository.dart';
import 'package:core_associates_app/features/promotions/data/promotions_repository.dart';
import 'package:core_associates_app/features/legal_support/data/legal_repository.dart';
import 'package:core_associates_app/features/documents/data/documents_repository.dart';

class MockApiClient extends Mock implements ApiClient {}

class MockSecureStorageService extends Mock implements SecureStorageService {}

class MockAuthRepository extends Mock implements AuthRepository {}

class MockProfileRepository extends Mock implements ProfileRepository {}

class MockPromotionsRepository extends Mock implements PromotionsRepository {}

class MockLegalRepository extends Mock implements LegalRepository {}

class MockDocumentsRepository extends Mock implements DocumentsRepository {}
